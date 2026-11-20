import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { AppSection, TopBar } from './components/TopBar.tsx';
import { ChapterWorkspace } from './components/ChapterWorkspace.tsx';
import { Studio3DView } from './components/Studio3DView.tsx';
import { LeaderboardView } from './components/LeaderboardView.tsx';
import { CollaborationView } from './components/CollaborationView.tsx';
import { CustomizationDrawer } from './components/CustomizationDrawer.tsx';
import type {
  AccentColor,
  ChapterItem,
  ChatMessageItem,
  GradeLevel,
  LayoutDensity,
  LeaderboardEntry,
  StudyRoom,
  ThemeMode,
} from './types/learning.ts';

const PlatformShell: React.FC = () => {
  const {
    profile,
    progress,
    badges,
    overallPrediction,
    idToken,
    signingIn,
    authError,
    signInWithGoogle,
    logout,
    apiFetch,
    updateLocalProgress,
    setProfileState,
  } = useAuth();

  const [activeSection, setActiveSection] = useState<AppSection>('curriculum');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Préférences personnalisables (synchronisées avec PostgreSQL dès connexion)
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [accentColor, setAccentColor] = useState<AccentColor>('indigo');
  const [layoutDensity, setLayoutDensity] = useState<LayoutDensity>('comfortable');
  const [show3DHints, setShow3DHints] = useState<boolean>(true);
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('6e');
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);

  // Données temps réel depuis Cloud SQL PostgreSQL
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [activeRoomSlug, setActiveRoomSlug] = useState<string>('entraide-college');
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [activePeers, setActivePeers] = useState<
    Array<{ displayName: string; gradeLevel: string; roomSlug: string }>
  >([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingCurriculum, setLoadingCurriculum] = useState<boolean>(true);

  const wsRef = useRef<WebSocket | null>(null);
  const activeRoomRef = useRef<string>(activeRoomSlug);
  activeRoomRef.current = activeRoomSlug;

  // Synchronise les préférences depuis le profil PostgreSQL
  useEffect(() => {
    if (!profile) return;
    setThemeMode((profile.themeMode as ThemeMode) || 'light');
    setAccentColor((profile.accentColor as AccentColor) || 'indigo');
    setLayoutDensity((profile.layoutDensity as LayoutDensity) || 'comfortable');
    setShow3DHints(profile.show3DHints ?? true);
    setSelectedGrade((profile.gradeLevel as GradeLevel) || '6e');
  }, [profile]);

  // Applique la classe .dark sur <html> pour Tailwind v4 @custom-variant dark
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [themeMode]);

  // Chargement initial depuis PostgreSQL
  useEffect(() => {
    let mounted = true;
    async function loadInitialData() {
      setLoadingCurriculum(true);
      setLoadError(null);
      try {
        const [curRes, lbRes, roomRes] = await Promise.all([
          fetch('/api/curriculum'),
          fetch('/api/leaderboard'),
          fetch(`/api/rooms?room=${encodeURIComponent(activeRoomSlug)}`),
        ]);
        if (!curRes.ok) throw new Error('Impossible de charger le programme.');
        const curData = await curRes.json();
        const lbData = lbRes.ok ? await lbRes.json() : { leaderboard: [] };
        const roomData = roomRes.ok
          ? await roomRes.json()
          : { rooms: [], messages: [] };

        if (!mounted) return;
        setChapters(curData.chapters || []);
        setLeaderboard(lbData.leaderboard || []);
        setRooms(roomData.rooms || []);
        setMessages(roomData.messages || []);
      } catch (err: unknown) {
        if (mounted) {
          setLoadError(
            err instanceof Error
              ? err.message
              : 'Erreur de connexion à la base de données.'
          );
        }
      } finally {
        if (mounted) setLoadingCurriculum(false);
      }
    }
    loadInitialData();
    return () => {
      mounted = false;
    };
  }, []);

  // Rechargement des messages lors du changement de salon
  const handleSelectRoom = useCallback(async (slug: string) => {
    setActiveRoomSlug(slug);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'room:join', roomSlug: slug }));
    }
    try {
      const res = await fetch(`/api/rooms?room=${encodeURIComponent(slug)}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load room messages:', err);
    }
  }, []);

  // Connexion WebSocket temps réel (avec reconnexion automatique)
  useEffect(() => {
    let closedByUnmount = false;
    let reconnectTimer: number | null = null;

    function connectWs() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'room:join', roomSlug: activeRoomRef.current }));
        if (idToken) {
          ws.send(JSON.stringify({ type: 'auth', token: idToken }));
        }
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.event === 'leaderboard:updated' && Array.isArray(msg.payload?.leaderboard)) {
            setLeaderboard(msg.payload.leaderboard);
          } else if (msg.event === 'presence:update' && msg.payload) {
            setOnlineCount(msg.payload.onlineCount ?? 1);
            setActivePeers(msg.payload.authenticatedUsers || []);
          } else if (msg.event === 'chat:message' && msg.payload) {
            const incoming = msg.payload as ChatMessageItem;
            if (!incoming.roomSlug || incoming.roomSlug === activeRoomRef.current) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === incoming.id)) return prev;
                return [...prev, incoming];
              });
            }
          }
        } catch {
          // Ignore malformed frame
        }
      };

      ws.onclose = () => {
        if (!closedByUnmount) {
          reconnectTimer = window.setTimeout(connectWs, 3000);
        }
      };
    }

    connectWs();

    return () => {
      closedByUnmount = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [idToken]);

  const handleUpdatePreferences = async (prefs: {
    displayName?: string;
    gradeLevel?: GradeLevel;
    themeMode?: ThemeMode;
    accentColor?: AccentColor;
    layoutDensity?: LayoutDensity;
    show3DHints?: boolean;
  }) => {
    if (prefs.themeMode) setThemeMode(prefs.themeMode);
    if (prefs.accentColor) setAccentColor(prefs.accentColor);
    if (prefs.layoutDensity) setLayoutDensity(prefs.layoutDensity);
    if (typeof prefs.show3DHints === 'boolean') setShow3DHints(prefs.show3DHints);
    if (prefs.gradeLevel) setSelectedGrade(prefs.gradeLevel);

    if (profile) {
      try {
        const res = await apiFetch('/api/me/preferences', {
          method: 'PATCH',
          body: JSON.stringify(prefs),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) setProfileState(data.user);
        }
      } catch (err) {
        console.error('Failed to persist preferences:', err);
      }
    }
  };

  const handleOpenChapter = (chapter: ChapterItem) => {
    setSelectedGrade(chapter.gradeLevel);
    setSelectedChapterId(chapter.id);
    setActiveSection('curriculum');
  };

  const handleMessageSentOptimistic = (msg: ChatMessageItem) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <TopBar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        profile={profile}
        accentColor={accentColor}
        signingIn={signingIn}
        onOpenCustomization={() => setDrawerOpen(true)}
        onSignIn={signInWithGoogle}
      />

      {/* Bannière discrète si erreur d'authentification ou chargement */}
      {(authError || loadError) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
            {authError || loadError}
          </div>
        </div>
      )}

      {/* Bandeau rapide de personnalisation & niveau sous le header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 flex items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div>
          {profile ? (
            <span>
              Bienvenue, <strong className="text-slate-900 dark:text-white">{profile.displayName}</strong> · Niveau {profile.gradeLevel} · Série {profile.streakDays} j.
            </span>
          ) : (
            <span>
              Mode exploration · Connectez-vous avec Google pour enregistrer vos progrès et discuter en direct
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white underline whitespace-nowrap shrink-0 cursor-pointer"
        >
          Personnaliser l’interface
        </button>
      </div>

      <main className="pb-14">
        {loadingCurriculum ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
            Initialisation du programme de mathématiques et du moteur WebGL...
          </div>
        ) : activeSection === 'curriculum' ? (
          <ChapterWorkspace
            chapters={chapters}
            selectedGrade={selectedGrade}
            onSelectGrade={(g) => setSelectedGrade(g)}
            selectedChapterId={selectedChapterId}
            onSelectChapter={(id) => setSelectedChapterId(id)}
            progressList={progress}
            themeMode={themeMode}
            accentColor={accentColor}
            layoutDensity={layoutDensity}
            showGrid={show3DHints}
            isAuthenticated={Boolean(profile)}
            signingIn={signingIn}
            onRequireSignIn={signInWithGoogle}
            apiFetch={apiFetch}
            onAttemptRecorded={(prog, newXp, newBadges) => {
              updateLocalProgress(prog, newXp, newBadges);
              fetch('/api/leaderboard')
                .then((r) => (r.ok ? r.json() : null))
                .then((d) => d?.leaderboard && setLeaderboard(d.leaderboard))
                .catch(() => {});
            }}
          />
        ) : activeSection === 'studio3d' ? (
          <Studio3DView
            chapters={chapters}
            initialGrade={selectedGrade}
            themeMode={themeMode}
            accentColor={accentColor}
            showGrid={show3DHints}
            onOpenChapterInCourse={handleOpenChapter}
          />
        ) : activeSection === 'leaderboard' ? (
          <LeaderboardView
            leaderboard={leaderboard}
            profile={profile}
            badges={badges}
            progress={progress}
            overallPrediction={overallPrediction}
            onSignIn={signInWithGoogle}
          />
        ) : (
          <CollaborationView
            rooms={rooms}
            activeRoomSlug={activeRoomSlug}
            onSelectRoom={handleSelectRoom}
            messages={messages}
            chapters={chapters}
            onlineCount={onlineCount}
            activePeers={activePeers}
            profile={profile}
            accentColor={accentColor}
            onSignIn={signInWithGoogle}
            apiFetch={apiFetch}
            onOpenSharedChapter={handleOpenChapter}
            onMessageSentOptimistic={handleMessageSentOptimistic}
          />
        )}
      </main>

      <CustomizationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        profile={profile}
        themeMode={themeMode}
        accentColor={accentColor}
        layoutDensity={layoutDensity}
        show3DHints={show3DHints}
        gradeLevel={selectedGrade}
        onUpdatePreferences={handleUpdatePreferences}
        onSignIn={signInWithGoogle}
        onLogout={logout}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <PlatformShell />
    </AuthProvider>
  );
}
