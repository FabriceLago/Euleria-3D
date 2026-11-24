import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, MessageSquare, Send, Swords, Users } from 'lucide-react';
import type {
  AccentColor,
  ChapterItem,
  ChatMessageItem,
  DuelLobbyItem,
  DuelRoomState,
  GradeLevel,
  StudyRoom,
  SubjectId,
  UserProfile,
} from '../types/learning.ts';
import { isSupabaseConfigured, sendSupabaseChatMessage } from '../lib/supabase.ts';
import { LiveDuelView } from './LiveDuelView.tsx';

interface CollaborationViewProps {
  rooms: StudyRoom[];
  activeRoomSlug: string;
  onSelectRoom: (slug: string) => void;
  messages: ChatMessageItem[];
  chapters: ChapterItem[];
  onlineCount: number;
  activePeers: Array<{ pseudonym: string; roomSlug: string }>;
  profile: UserProfile | null;
  accentColor: AccentColor;
  backendAvailable: boolean;
  defaultGrade: GradeLevel;
  duelLobby: DuelLobbyItem[];
  activeDuel: DuelRoomState | null;
  duelError: string | null;
  onCreateDuel: (opts: {
    subject: SubjectId | 'all';
    gradeLevel: GradeLevel;
    questionCount: number;
  }) => void;
  onJoinDuel: (code: string) => void;
  onStartDuel: (code: string) => void;
  onAnswerDuel: (code: string, questionId: string, answer: string) => void;
  onLeaveDuel: () => void;
  onRefreshLobby: () => void;
  onSignIn: () => void;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onOpenSharedChapter: (chapter: ChapterItem) => void;
  onMessageSentOptimistic: (msg: ChatMessageItem) => void;
}

const ACCENT_SEND_MAP: Record<AccentColor, string> = {
  indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  amber: 'bg-amber-600 hover:bg-amber-700 text-white',
  sky: 'bg-sky-600 hover:bg-sky-700 text-white',
};

export const CollaborationView: React.FC<CollaborationViewProps> = ({
  rooms,
  activeRoomSlug,
  onSelectRoom,
  messages,
  chapters,
  onlineCount,
  activePeers,
  profile,
  accentColor,
  backendAvailable,
  defaultGrade,
  duelLobby,
  activeDuel,
  duelError,
  onCreateDuel,
  onJoinDuel,
  onStartDuel,
  onAnswerDuel,
  onLeaveDuel,
  onRefreshLobby,
  onSignIn,
  apiFetch,
  onOpenSharedChapter,
  onMessageSentOptimistic,
}) => {
  const [subView, setSubView] = useState<'rooms' | 'duels'>('rooms');
  const [content, setContent] = useState('');
  const [sharedChapterId, setSharedChapterId] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Messages masqués par cet élève (pour lui seul, mémorisé sur cet appareil) et déjà signalés
  const HIDDEN_KEY = 'euleria:hidden-chat';
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(() => {
    try {
      return new Set<number>(JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]'));
    } catch {
      return new Set<number>();
    }
  });
  const [reportedIds, setReportedIds] = useState<Set<number>>(new Set());
  const hideLocally = (id: number) =>
    setHiddenIds((prev) => {
      const next = new Set(prev).add(id);
      try {
        localStorage.setItem(HIDDEN_KEY, JSON.stringify([...next].slice(-500)));
      } catch {
        // stockage indisponible : masqué pour la session seulement
      }
      return next;
    });
  const reportMessage = async (id: number) => {
    if (!backendAvailable) return;
    try {
      const res = await apiFetch(`/api/rooms/messages/${id}/report`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || 'Signalement impossible pour le moment.');
        return;
      }
      setReportedIds((prev) => new Set(prev).add(id));
      hideLocally(id);
    } catch {
      setError('Signalement impossible pour le moment.');
    }
  };
  const visibleMessages = messages.filter((m) => !hiddenIds.has(m.id));

  useEffect(() => {
    if (activeDuel) {
      setSubView('duels');
    }
  }, [activeDuel]);

  const chapterMap = useMemo(() => {
    const m = new Map<number, ChapterItem>();
    for (const c of chapters) m.set(c.id, c);
    return m;
  }, [chapters]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeRoomSlug]);

  const activeRoom = rooms.find((r) => r.slug === activeRoomSlug) || rooms[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !activeRoom) return;
    if (!profile) {
      onSignIn();
      return;
    }

    setSending(true);
    setError(null);
    try {
      if (!backendAvailable && isSupabaseConfigured) {
        const sent = await sendSupabaseChatMessage({
          roomId: activeRoom.id,
          roomSlug: activeRoom.slug,
          author: profile,
          content: content.trim(),
          sharedChapterId: sharedChapterId ? Number(sharedChapterId) : null,
        });
        if (!sent) {
          throw new Error('Envoi impossible vers Supabase.');
        }
        onMessageSentOptimistic(sent);
        setContent('');
        setSharedChapterId('');
        return;
      }

      const res = await apiFetch(`/api/rooms/${activeRoom.slug}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: content.trim(),
          sharedChapterId: sharedChapterId ? Number(sharedChapterId) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Envoi impossible.');
      }
      if (data.message) {
        onMessageSentOptimistic(data.message);
      }
      setContent('');
      setSharedChapterId('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur réseau.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="pb-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {subView === 'duels'
              ? 'Défis synchronisés par WebSocket · Duels 1v1 & Mini-Tournois (jusqu’à 6 joueurs)'
              : 'Collaboration entre pairs (6ᵉ à Terminale) · WebSocket temps réel'}
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {subView === 'duels'
              ? 'Duels & Tournois scientifiques en direct'
              : 'Salons d’entraide et partage 3D'}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setSubView('rooms')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                subView === 'rooms'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Salons d’entraide</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSubView('duels');
                onRefreshLobby();
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                subView === 'duels'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Duels & Tournois Live</span>
              {duelLobby.length > 0 && (
                <span className="font-mono tabular-nums text-[11px] text-indigo-600 dark:text-indigo-400">
                  ({duelLobby.length})
                </span>
              )}
            </button>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
            {onlineCount} {onlineCount > 1 ? 'connexions actives' : 'connexion active'}
          </div>
        </div>
      </div>

      {subView === 'duels' ? (
        <LiveDuelView
          backendAvailable={backendAvailable}
          defaultGrade={defaultGrade}
          accentColor={accentColor}
          duelLobby={duelLobby}
          activeDuel={activeDuel}
          duelError={duelError}
          onCreateDuel={onCreateDuel}
          onJoinDuel={onJoinDuel}
          onStartDuel={onStartDuel}
          onAnswerDuel={onAnswerDuel}
          onLeaveDuel={onLeaveDuel}
          onRefreshLobby={onRefreshLobby}
        />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Salons & Pairs en ligne */}
        <div className="lg:col-span-4 space-y-5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1 mb-2">
              Salons thématiques
            </div>
            {rooms.map((room) => {
              const active = room.slug === activeRoomSlug;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => onSelectRoom(room.slug)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                    active
                      ? 'border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{room.name}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {room.topic}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
              <Users className="w-3.5 h-3.5" />
              <span>Élèves authentifiés en ligne ({activePeers.length})</span>
            </div>
            {activePeers.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connectez-vous avec Google pour apparaître dans la liste de présence collaborative.
              </p>
            ) : (
              <ul className="space-y-2 text-xs">
                {activePeers.map((peer, i) => (
                  <li
                    key={`${peer.pseudonym}-${i}`}
                    className="flex items-center justify-between text-slate-700 dark:text-slate-200"
                  >
                    <span className="font-medium truncate">{peer.pseudonym}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Fil de discussion temps réel */}
        <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-[560px]">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                {activeRoom?.name || 'Salon'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {activeRoom?.topic}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {visibleMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-sm text-slate-500 dark:text-slate-400">
                Aucun message dans ce salon pour l’instant. Posez une question sur un théorème ou partagez un chapitre 3D.
              </div>
            ) : (
              visibleMessages.map((msg) => {
                const isMine = !!profile?.pseudonym && profile.pseudonym === msg.authorName;
                const sharedChap = msg.sharedChapterId
                  ? chapterMap.get(msg.sharedChapterId)
                  : undefined;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {msg.authorName}
                      </span>{' '}
                      ·{' '}
                      <span className="font-mono tabular-nums">
                        {new Date(msg.createdAt).toLocaleTimeString(document.documentElement.lang, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div
                      className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed border ${
                        isMine
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      {sharedChap && (
                        <button
                          type="button"
                          onClick={() => onOpenSharedChapter(sharedChap)}
                          className={`mt-2 w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                            isMine
                              ? 'bg-white/15 border-white/25 text-white hover:bg-white/25'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-950'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <BookOpen className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              {sharedChap.subject === 'physics_chemistry'
                                ? 'Phys.-Chim.'
                                : sharedChap.subject === 'svt'
                                  ? 'SVT'
                                  : sharedChap.subject === 'history_geography'
                                    ? 'Hist.-Géo'
                                    : sharedChap.subject === 'french_philosophy'
                                      ? 'Français'
                                      : sharedChap.subject === 'english_lv1'
                                        ? 'Anglais'
                                        : 'Maths'}{' '}
                              · {sharedChap.gradeLevel} · {sharedChap.title}
                            </span>
                          </span>
                          <span className="shrink-0 underline">Ouvrir 3D</span>
                        </button>
                      )}
                    </div>
                    {!isMine && profile && (
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                        <button
                          type="button"
                          onClick={() => hideLocally(msg.id)}
                          className="hover:text-slate-800 dark:hover:text-slate-200 underline-offset-2 hover:underline cursor-pointer"
                        >
                          Masquer
                        </button>
                        <button
                          type="button"
                          disabled={reportedIds.has(msg.id) || !backendAvailable}
                          onClick={() => reportMessage(msg.id)}
                          className="hover:text-rose-600 dark:hover:text-rose-400 underline-offset-2 hover:underline cursor-pointer disabled:cursor-default disabled:no-underline"
                        >
                          {reportedIds.has(msg.id) ? 'Signalé' : 'Signaler'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5"
          >
            {error && (
              <div className="text-xs text-red-600 dark:text-red-400">{error}</div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={sharedChapterId}
                onChange={(e) => setSharedChapterId(e.target.value)}
                aria-label="Joindre un chapitre 3D"
                className="sm:w-56 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value="">Joindre un chapitre (optionnel)</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    [
                    {c.subject === 'physics_chemistry'
                      ? 'Phys.-Chim.'
                      : c.subject === 'svt'
                        ? 'SVT'
                        : c.subject === 'history_geography'
                          ? 'Hist.-Géo'
                          : c.subject === 'french_philosophy'
                            ? 'Français'
                            : c.subject === 'english_lv1'
                              ? 'Anglais'
                              : 'Maths'}
                    ] {c.gradeLevel} — {c.title}
                  </option>
                ))}
              </select>

              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={
                    profile
                      ? 'Écrire un message d’entraide ou poser une question...'
                      : 'Connectez-vous avec Google pour participer au salon...'
                  }
                  maxLength={1000}
                  className="flex-1 px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${ACCENT_SEND_MAP[accentColor]}`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{profile ? (sending ? 'Envoi...' : 'Envoyer') : 'Connexion'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      )}
    </div>
  );
};
