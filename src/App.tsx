import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { lazyWithReload } from './utils/lazyWithReload.ts';
import { AgeGate } from './components/AgeGate.tsx';
import { LegalFooter } from './components/LegalFooter.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { AppSection, TopBar } from './components/TopBar.tsx';
import { ChapterWorkspace } from './components/ChapterWorkspace.tsx';
import { CustomizationDrawer } from './components/CustomizationDrawer.tsx';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallPrompt.tsx';
import { PrintDocumentPortal, type PrintableDocument } from './utils/printExport.tsx';
import { apiUrl, wsUrl } from './lib/api.ts';
import {
  fetchSupabaseLeaderboard,
  fetchSupabaseRoomsAndMessages,
  isSupabaseConfigured,
  updateSupabasePreferences,
} from './lib/supabase.ts';
import { ALL_SEED_CHAPTERS, ALL_SEED_ROOMS as RAW_SEED_ROOMS } from './db/curriculumData.ts';
import { translateDeep } from './i18n/core.ts';
import { useI18n } from './i18n/I18nProvider.tsx';
import type {
  AccentColor,
  ChapterItem,
  ChatMessageItem,
  DuelLobbyItem,
  DuelRoomState,
  GradeLevel,
  LayoutDensity,
  LeaderboardEntry,
  MistakeItem,
  StudyRoom,
  SubjectId,
  ThemeMode,
} from './types/learning.ts';
import type { MissionResult } from './missions/types.ts';

// Écrans chargés à la demande ; un rechargement unique récupère la nouvelle version après un déploiement
const DynamicQuizView = lazyWithReload(() =>
  import('./components/DynamicQuizView.tsx').then((m) => ({ default: m.DynamicQuizView }))
);
const Studio3DView = lazyWithReload(() =>
  import('./components/Studio3DView.tsx').then((m) => ({ default: m.Studio3DView }))
);
const LeaderboardView = lazyWithReload(() =>
  import('./components/LeaderboardView.tsx').then((m) => ({ default: m.LeaderboardView }))
);
const CollaborationView = lazyWithReload(() =>
  import('./components/CollaborationView.tsx').then((m) => ({ default: m.CollaborationView }))
);

function buildLocalCurriculum(): ChapterItem[] {
  let exIdCounter = 1;
  return ALL_SEED_CHAPTERS.map((ch, idx) => {
    const chapterId = idx + 1;
    return {
      id: chapterId,
      slug: ch.slug,
      subject: ch.subject || 'mathematics',
      gradeLevel: ch.gradeLevel,
      orderIndex: ch.orderIndex,
      title: ch.title,
      subtitle: ch.subtitle,
      summary: ch.summary,
      theoryContent: ch.theoryContent,
      formulaDisplay: ch.formulaDisplay,
      scenePreset: ch.scenePreset,
      defaultParams: ch.defaultParams,
      xpReward: ch.xpReward,
      estimatedMinutes: ch.estimatedMinutes,
      exercises: ch.exercises.map((ex) => ({
        id: exIdCounter++,
        chapterId,
        orderIndex: ex.orderIndex,
        exerciseType: ex.exerciseType,
        prompt: ex.prompt,
        hint: ex.hint,
        options: ex.options,
        xpValue: ex.xpValue,
      })),
    };
  });
}

const PlatformShell: React.FC = () => {
  const { dict, t } = useI18n();
  const ALL_SEED_ROOMS = translateDeep(RAW_SEED_ROOMS, dict);
  const {
    firebaseUser,
    profile,
    progress,
    badges,
    overallPrediction,
    signingIn,
    authError,
    getFreshIdToken,
    signInWithGoogle,
    logout,
    apiFetch,
    updateLocalProgress,
    applyXpAndBadges,
    setProfileState,
    ageRequired,
    confirmAge,
    deleteAccount,
  } = useAuth();

  const [activeSection, setActiveSection] = useState<AppSection>('curriculum');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Préférences personnalisables (synchronisées avec PostgreSQL dès connexion)
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [accentColor, setAccentColor] = useState<AccentColor>('indigo');
  const [layoutDensity, setLayoutDensity] = useState<LayoutDensity>('comfortable');
  const [show3DHints, setShow3DHints] = useState<boolean>(true);
  const [selectedSubject, setSelectedSubject] = useState<SubjectId>('mathematics');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('6e');
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [quizSeedChapterIds, setQuizSeedChapterIds] = useState<number[] | undefined>(undefined);
  const [quizWorkspaceMode, setQuizWorkspaceMode] = useState<'quiz' | 'exam' | 'grand_oral'>('quiz');

  // Impression PDF propre (iframe-safe via PrintDocumentPortal)
  const [printableDoc, setPrintableDoc] = useState<PrintableDocument | null>(null);

  // Carnet d'erreurs local (complète l'historique Cloud SQL pour les quiz et invités)
  const [sessionMistakes, setSessionMistakes] = useState<MistakeItem[]>([]);

  // Duels & Tournois Live WebSocket
  const [duelLobby, setDuelLobby] = useState<DuelLobbyItem[]>([]);
  const [activeDuel, setActiveDuel] = useState<DuelRoomState | null>(null);
  const [duelError, setDuelError] = useState<string | null>(null);

  // Données temps réel depuis Cloud SQL PostgreSQL
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [activeRoomSlug, setActiveRoomSlug] = useState<string>('entraide-college');
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [activePeers, setActivePeers] = useState<
    Array<{ pseudonym: string; roomSlug: string }>
  >([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [backendAvailable, setBackendAvailable] = useState<boolean>(true);
  const [loadingCurriculum, setLoadingCurriculum] = useState<boolean>(true);

  const wsRef = useRef<WebSocket | null>(null);
  const activeRoomRef = useRef<string>(activeRoomSlug);
  activeRoomRef.current = activeRoomSlug;
  const lastProfileUidRef = useRef<string | null>(null);
  const lastProfileGradeRef = useRef<string | null>(null);

  // Synchronise les préférences depuis le profil PostgreSQL sans réinitialiser la classe lors d'un gain d'XP
  useEffect(() => {
    if (!profile) {
      lastProfileUidRef.current = null;
      lastProfileGradeRef.current = null;
      return;
    }
    setThemeMode((profile.themeMode as ThemeMode) || 'light');
    setAccentColor((profile.accentColor as AccentColor) || 'indigo');
    setLayoutDensity((profile.layoutDensity as LayoutDensity) || 'comfortable');
    setShow3DHints(profile.show3DHints ?? true);

    const isNewUserSession = lastProfileUidRef.current !== profile.uid;
    const gradeChangedInProfile = lastProfileGradeRef.current !== profile.gradeLevel;
    if (isNewUserSession || gradeChangedInProfile) {
      setSelectedGrade((profile.gradeLevel as GradeLevel) || '6e');
      lastProfileUidRef.current = profile.uid;
      lastProfileGradeRef.current = profile.gradeLevel;
    }
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

  // Chargement initial depuis PostgreSQL (avec mode cours autonome si hébergement statique sans API)
  useEffect(() => {
    let mounted = true;
    async function loadInitialData() {
      setLoadingCurriculum(true);
      setLoadError(null);
      try {
        const [curRes, lbRes, roomRes] = await Promise.all([
          fetch(apiUrl('/api/curriculum')),
          fetch(apiUrl('/api/leaderboard')),
          fetch(apiUrl(`/api/rooms?room=${encodeURIComponent(activeRoomSlug)}`)),
        ]);
        const curContentType = curRes.headers.get('content-type') || '';
        if (!curRes.ok || !curContentType.includes('application/json')) {
          throw new Error(`HTTP_${curRes.status}`);
        }
        const curData = await curRes.json();
        const lbData = lbRes.ok ? await lbRes.json() : { leaderboard: [] };
        const roomData = roomRes.ok
          ? await roomRes.json()
          : { rooms: [], messages: [] };

        if (!mounted) return;
        setBackendAvailable(true);
        setChapters(curData.chapters || []);
        setLeaderboard(lbData.leaderboard || []);
        setRooms(roomData.rooms || []);
        setMessages(roomData.messages || []);
      } catch {
        if (!mounted) return;
        // Hébergement statique détecté : programme complet en local + synchronisation Supabase si configurée
        setBackendAvailable(false);
        setChapters(translateDeep(buildLocalCurriculum(), dict));

        if (isSupabaseConfigured) {
          try {
            const [sbLeaderboard, sbRoomsData] = await Promise.all([
              fetchSupabaseLeaderboard(25),
              fetchSupabaseRoomsAndMessages(activeRoomSlug),
            ]);
            if (!mounted) return;
            setLeaderboard(sbLeaderboard);
            setRooms(
              sbRoomsData.rooms.length > 0
                ? sbRoomsData.rooms
                : ALL_SEED_ROOMS.map((r, i) => ({
                    id: i + 1,
                    slug: r.slug,
                    name: r.name,
                    gradeLevel: r.gradeLevel,
                    topic: r.topic,
                  }))
            );
            setMessages(sbRoomsData.messages);
          } catch {
            if (!mounted) return;
            setLeaderboard([]);
            setRooms(
              ALL_SEED_ROOMS.map((r, i) => ({
                id: i + 1,
                slug: r.slug,
                name: r.name,
                gradeLevel: r.gradeLevel,
                topic: r.topic,
              }))
            );
            setMessages([]);
          }
        } else {
          setLeaderboard([]);
          setRooms(
            ALL_SEED_ROOMS.map((r, i) => ({
              id: i + 1,
              slug: r.slug,
              name: r.name,
              gradeLevel: r.gradeLevel,
              topic: r.topic,
            }))
          );
          setMessages([]);
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
    if (!backendAvailable) {
      if (isSupabaseConfigured) {
        try {
          const data = await fetchSupabaseRoomsAndMessages(slug);
          setMessages(data.messages);
        } catch (err) {
          console.error('Failed to load Supabase room messages:', err);
        }
      }
      return;
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'room:join', roomSlug: slug }));
    }
    try {
      const res = await fetch(apiUrl(`/api/rooms?room=${encodeURIComponent(slug)}`));
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load room messages:', err);
    }
  }, [backendAvailable]);

  // Connexion WebSocket temps réel (uniquement quand le backend Node/Cloud Run est actif)
  useEffect(() => {
    if (!backendAvailable) return;

    let closedByUnmount = false;
    let reconnectTimer: number | null = null;

    function connectWs() {
      const ws = new WebSocket(wsUrl('/ws'));
      wsRef.current = ws;
      let retriedExpiredAuth = false;

      ws.onopen = async () => {
        ws.send(JSON.stringify({ type: 'room:join', roomSlug: activeRoomRef.current }));
        ws.send(JSON.stringify({ type: 'duel:list' }));
        const freshToken = await getFreshIdToken(false);
        if (!closedByUnmount && freshToken && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'auth', token: freshToken }));
        }
      };

      ws.onmessage = async (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.event === 'auth:expired') {
            if (!retriedExpiredAuth) {
              retriedExpiredAuth = true;
              const refreshedToken = await getFreshIdToken(true);
              if (!closedByUnmount && refreshedToken && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'auth', token: refreshedToken }));
              }
            }
          } else if (msg.event === 'leaderboard:updated' && Array.isArray(msg.payload?.leaderboard)) {
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
          } else if (msg.event === 'chat:hidden' && typeof msg.payload?.id === 'number') {
            // Message masqué après signalements : retiré en direct chez tout le monde
            const hiddenId = msg.payload.id as number;
            setMessages((prev) => prev.filter((m) => m.id !== hiddenId));
          } else if (msg.event === 'duel:lobby' && Array.isArray(msg.payload?.rooms)) {
            setDuelLobby(msg.payload.rooms as DuelLobbyItem[]);
          } else if (msg.event === 'duel:state' && msg.payload) {
            setActiveDuel(msg.payload as DuelRoomState);
            setDuelError(null);
          } else if (msg.event === 'duel:error' && msg.payload?.message) {
            setDuelError(String(msg.payload.message));
          } else if (msg.event === 'duel:left') {
            setActiveDuel(null);
            setDuelError(null);
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
  }, [firebaseUser?.uid, backendAvailable, getFreshIdToken]);

  const handleUpdatePreferences = async (prefs: {
    displayName?: string;
    gradeLevel?: GradeLevel;
    themeMode?: ThemeMode;
    accentColor?: AccentColor;
    layoutDensity?: LayoutDensity;
    show3DHints?: boolean;
    weeklyXpGoal?: number;
  }) => {
    if (prefs.themeMode) setThemeMode(prefs.themeMode);
    if (prefs.accentColor) setAccentColor(prefs.accentColor);
    if (prefs.layoutDensity) setLayoutDensity(prefs.layoutDensity);
    if (typeof prefs.show3DHints === 'boolean') setShow3DHints(prefs.show3DHints);
    if (prefs.gradeLevel) setSelectedGrade(prefs.gradeLevel);

    if (profile) {
      if (!backendAvailable && isSupabaseConfigured) {
        const updated = await updateSupabasePreferences(profile.uid, prefs);
        if (updated) setProfileState(updated);
      } else if (backendAvailable) {
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
    }
  };

  // Classement public : opt-in explicite (désactivé par défaut), sous pseudonyme
  const handleToggleLeaderboard = async (optIn: boolean) => {
    if (!profile || !backendAvailable) return;
    try {
      const res = await apiFetch('/api/me/leaderboard', { method: 'PUT', body: JSON.stringify({ optIn }) });
      if (!res.ok) return;
      const data = await res.json();
      if (data.user) setProfileState(data.user);
      if (Array.isArray(data.leaderboard)) setLeaderboard(data.leaderboard);
    } catch (err) {
      console.error('Failed to update leaderboard opt-in:', err);
    }
  };

  const handleOpenChapter = (chapter: ChapterItem) => {
    setSelectedSubject(chapter.subject || 'mathematics');
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

  const handlePrintDocument = useCallback((doc: PrintableDocument) => {
    setPrintableDoc(doc);
    requestAnimationFrame(() => {
      window.setTimeout(() => {
        window.print();
      }, 80);
    });
  }, []);

  const handleRecordMistake = useCallback((mistake: MistakeItem) => {
    setSessionMistakes((prev) => {
      const existing = prev.find((m) => m.key === mistake.key);
      if (existing) {
        return prev.map((m) =>
          m.key === mistake.key
            ? {
                ...m,
                wrongCount: m.wrongCount + 1,
                lastSubmittedAnswer: mistake.lastSubmittedAnswer,
                lastWrongAt: mistake.lastWrongAt,
                resolved: false,
              }
            : m
        );
      }
      return [mistake, ...prev].slice(0, 80);
    });
  }, []);

  const handleMarkMistakeResolved = useCallback((key: string) => {
    setSessionMistakes((prev) =>
      prev.map((m) => (m.key === key ? { ...m, resolved: true } : m))
    );
  }, []);

  const handleMissionComplete = useCallback(
    // Renvoie les XP réellement accordées par le serveur (plafond quotidien inclus), null si aucune
    async (r: MissionResult): Promise<number | null> => {
      if (!backendAvailable || !profile) return null; // mode local : étoiles gardées sur l'appareil, pas d'XP (comme les exercices)
      try {
        const res = await apiFetch('/api/missions/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ missionId: r.missionId, stars: r.stars, timeMs: r.timeMs }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (typeof data.userXp === 'number') applyXpAndBadges(data.userXp, data.newlyUnlockedBadges ?? []);
        return typeof data.xpEarned === 'number' ? data.xpEarned : null;
      } catch {
        return null; // hors ligne : la mission reste jouable, seules les XP ne sont pas créditées
      }
    },
    [backendAvailable, profile, apiFetch, applyXpAndBadges]
  );

  const handleMissionFailed = useCallback(
    (r: MissionResult, chapter: ChapterItem) => {
      handleRecordMistake({
        key: `mission-${r.missionId}`,
        exerciseId: null,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        subject: chapter.subject || 'mathematics',
        gradeLevel: chapter.gradeLevel,
        exerciseType: 'practice',
        prompt: r.prompt,
        hint: r.hint,
        options: null,
        explanation: r.hint,
        lastSubmittedAnswer: '',
        wrongCount: 1,
        lastWrongAt: new Date().toISOString(),
        resolved: false,
        source: 'mission',
      });
    },
    [handleRecordMistake]
  );

  const sendDuelMessage = useCallback((payload: Record<string, unknown>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      setDuelError(t('Connexion au direct indisponible. Patientez un instant ou rechargez la page.'));
    }
  }, [t]);

  const handleCreateDuel = useCallback(
    (opts: { subject: SubjectId | 'all'; gradeLevel: GradeLevel; questionCount: number }) => {
      setDuelError(null);
      sendDuelMessage({ type: 'duel:create', ...opts });
    },
    [sendDuelMessage]
  );

  const handleJoinDuel = useCallback(
    (code: string) => {
      setDuelError(null);
      sendDuelMessage({ type: 'duel:join', code });
    },
    [sendDuelMessage]
  );

  const handleStartDuel = useCallback(
    (code: string) => {
      setDuelError(null);
      sendDuelMessage({ type: 'duel:start', code });
    },
    [sendDuelMessage]
  );

  const handleAnswerDuel = useCallback(
    (code: string, questionId: string, answer: string) => {
      sendDuelMessage({ type: 'duel:answer', code, questionId, answer });
    },
    [sendDuelMessage]
  );

  const handleLeaveDuel = useCallback(() => {
    sendDuelMessage({ type: 'duel:leave' });
    setActiveDuel(null);
    setDuelError(null);
  }, [sendDuelMessage]);

  const handleRefreshDuelLobby = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'duel:list' }));
    }
  }, []);

  return (
    <>
      <div
        id="euleria-app-shell"
        className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors"
      >
      <TopBar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        profile={profile}
        accentColor={accentColor}
        signingIn={signingIn}
        onOpenCustomization={() => setDrawerOpen(true)}
        onSignIn={signInWithGoogle}
      />

      {/* Bannière discrète si erreur d'authentification ou hébergement statique sans backend */}
      {(authError || loadError) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300">
            {authError || loadError}
          </div>
        </div>
      )}
      {!loadingCurriculum && !backendAvailable && !isSupabaseConfigured && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
          <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-200">
            {t('Mode hors ligne : cours, scènes 3D, quiz et missions restent disponibles. Le compte, le classement et le chat reviendront dès que la connexion au serveur sera rétablie.')}
          </div>
        </div>
      )}

      {/* Bandeau rapide de personnalisation & niveau sous le header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 flex items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div>
          {profile ? (
            <span>
              {t('Bienvenue,')} <strong className="text-slate-900 dark:text-white">{profile.displayName}</strong> · {t('Niveau {grade} · Série {days} j.', { grade: profile.gradeLevel, days: profile.streakDays })}
            </span>
          ) : (
            <span>
              {t('Mode exploration · Connectez-vous avec Google pour enregistrer vos progrès et discuter en direct')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <PWAInstallButton variant="inline" />
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t('Personnaliser l’interface')}
          </button>
        </div>
      </div>

      <main className="pb-14">
        {loadingCurriculum ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
            {t('Initialisation des programmes scientifiques et du moteur WebGL...')}
          </div>
        ) : activeSection === 'curriculum' ? (
          <ChapterWorkspace
            chapters={chapters}
            selectedSubject={selectedSubject}
            onSelectSubject={(subj) => {
              setSelectedSubject(subj);
              setSelectedChapterId(null);
            }}
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
            backendAvailable={backendAvailable}
            signingIn={signingIn}
            onRequireSignIn={signInWithGoogle}
            apiFetch={apiFetch}
            onAttemptRecorded={(prog, newXp, newBadges) => {
              updateLocalProgress(prog, newXp, newBadges);
              if (backendAvailable) {
                fetch(apiUrl('/api/leaderboard'))
                  .then((r) => (r.ok ? r.json() : null))
                  .then((d) => d?.leaderboard && setLeaderboard(d.leaderboard))
                  .catch(() => {});
              }
            }}
            onLaunchDynamicQuiz={(chapterId) => {
              setQuizWorkspaceMode('quiz');
              setQuizSeedChapterIds([chapterId]);
              setActiveSection('quiz');
            }}
            onXpSynced={(newTotalXp, newBadges) => {
              applyXpAndBadges(newTotalXp, newBadges);
              if (backendAvailable) {
                fetch(apiUrl('/api/leaderboard'))
                  .then((r) => (r.ok ? r.json() : null))
                  .then((d) => d?.leaderboard && setLeaderboard(d.leaderboard))
                  .catch(() => {});
              }
            }}
            onPrintDocument={handlePrintDocument}
            onMistakeRecorded={handleRecordMistake}
            onMissionComplete={handleMissionComplete}
            onMissionFailed={handleMissionFailed}
            missionXpEnabled={backendAvailable && !!profile}
          />
        ) : (
          <Suspense
            fallback={
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                {t('Chargement du module interactif...')}
              </div>
            }
          >
            {activeSection === 'quiz' ? (
              <DynamicQuizView
                chapters={chapters}
                initialChapterIds={quizSeedChapterIds}
                initialWorkspaceMode={quizWorkspaceMode}
                profile={profile}
                accentColor={accentColor}
                backendAvailable={backendAvailable}
                onSignIn={signInWithGoogle}
                apiFetch={apiFetch}
                onXpSynced={(newTotalXp, newBadges) => {
                  applyXpAndBadges(newTotalXp, newBadges);
                  if (backendAvailable) {
                    fetch(apiUrl('/api/leaderboard'))
                      .then((r) => (r.ok ? r.json() : null))
                      .then((d) => d?.leaderboard && setLeaderboard(d.leaderboard))
                      .catch(() => {});
                  }
                }}
                onPrintDocument={handlePrintDocument}
                onMistakeRecorded={handleRecordMistake}
              />
            ) : activeSection === 'studio3d' ? (
              <Studio3DView
                chapters={chapters}
                selectedSubject={selectedSubject}
                onSelectSubject={setSelectedSubject}
                initialGrade={selectedGrade}
                themeMode={themeMode}
                accentColor={accentColor}
                showGrid={show3DHints}
                onOpenChapterInCourse={handleOpenChapter}
                onMissionComplete={handleMissionComplete}
                onMissionFailed={handleMissionFailed}
                missionXpEnabled={backendAvailable && !!profile}
              />
            ) : activeSection === 'leaderboard' ? (
              <LeaderboardView
                leaderboard={leaderboard}
                profile={profile}
                badges={badges}
                progress={progress}
                chapters={chapters}
                selectedGrade={selectedGrade}
                accentColor={accentColor}
                backendAvailable={backendAvailable}
                totalChaptersCount={chapters.length || 126}
                overallPrediction={overallPrediction}
                sessionMistakes={sessionMistakes}
                onSignIn={signInWithGoogle}
                apiFetch={apiFetch}
                onOpenChapter={handleOpenChapter}
                onLaunchDynamicQuiz={(chapterId) => {
                  setQuizWorkspaceMode('quiz');
                  setQuizSeedChapterIds([chapterId]);
                  setActiveSection('quiz');
                }}
                onOpenMockExams={() => {
                  setQuizSeedChapterIds(undefined);
                  setQuizWorkspaceMode('exam');
                  setActiveSection('quiz');
                }}
                onUpdateWeeklyGoal={async (goalXp) => {
                  await handleUpdatePreferences({ weeklyXpGoal: goalXp });
                }}
                onMarkSessionMistakeResolved={handleMarkMistakeResolved}
                onAttemptRecorded={(prog, newXp, newBadges) => {
                  updateLocalProgress(prog, newXp, newBadges || []);
                  if (backendAvailable) {
                    fetch(apiUrl('/api/leaderboard'))
                      .then((r) => (r.ok ? r.json() : null))
                      .then((d) => d?.leaderboard && setLeaderboard(d.leaderboard))
                      .catch(() => {});
                  }
                }}
                onPrintDocument={handlePrintDocument}
                onToggleLeaderboard={handleToggleLeaderboard}
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
                backendAvailable={backendAvailable}
                defaultGrade={selectedGrade}
                duelLobby={duelLobby}
                activeDuel={activeDuel}
                duelError={duelError}
                onCreateDuel={handleCreateDuel}
                onJoinDuel={handleJoinDuel}
                onStartDuel={handleStartDuel}
                onAnswerDuel={handleAnswerDuel}
                onLeaveDuel={handleLeaveDuel}
                onRefreshLobby={handleRefreshDuelLobby}
                onSignIn={signInWithGoogle}
                apiFetch={apiFetch}
                onOpenSharedChapter={handleOpenChapter}
                onMessageSentOptimistic={handleMessageSentOptimistic}
                onChatRulesAccepted={setProfileState}
              />
            )}
          </Suspense>
        )}
      </main>

      <LegalFooter />

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
        onDeleteAccount={deleteAccount}
      />
      </div>

      {ageRequired && <AgeGate onConfirm={confirmAge} onCancel={() => void logout()} />}

      <PrintDocumentPortal document={printableDoc} />
      <OfflineIndicator />
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <PlatformShell />
    </AuthProvider>
  );
}
