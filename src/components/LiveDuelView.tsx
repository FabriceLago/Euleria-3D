import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Copy,
  LogOut,
  Play,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
import { GRADE_LEVELS, SUBJECTS } from '../db/curriculumData.ts';
import type {
  AccentColor,
  DuelLobbyItem,
  DuelRoomState,
  GradeLevel,
  SubjectId,
} from '../types/learning.ts';

interface LiveDuelViewProps {
  backendAvailable: boolean;
  defaultGrade: GradeLevel;
  accentColor: AccentColor;
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
}

const ACCENT_BTN_MAP: Record<AccentColor, string> = {
  indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  amber: 'bg-amber-600 hover:bg-amber-700 text-white',
  sky: 'bg-sky-600 hover:bg-sky-700 text-white',
};

export const LiveDuelView: React.FC<LiveDuelViewProps> = ({
  backendAvailable,
  defaultGrade,
  accentColor,
  duelLobby,
  activeDuel,
  duelError,
  onCreateDuel,
  onJoinDuel,
  onStartDuel,
  onAnswerDuel,
  onLeaveDuel,
  onRefreshLobby,
}) => {
  const [subject, setSubject] = useState<SubjectId | 'all'>('all');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(defaultGrade);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [remainingSec, setRemainingSec] = useState<number>(25);
  const [pickedOption, setPickedOption] = useState<string | null>(null);

  useEffect(() => {
    setGradeLevel(defaultGrade);
  }, [defaultGrade]);

  useEffect(() => {
    setPickedOption(null);
  }, [activeDuel?.currentQuestion?.id]);

  useEffect(() => {
    if (!activeDuel || activeDuel.status !== 'active' || !activeDuel.questionStartedAt) {
      return;
    }
    const update = () => {
      const elapsed = Date.now() - (activeDuel.questionStartedAt || Date.now());
      const left = Math.max(0, Math.ceil((activeDuel.questionTimeLimitMs - elapsed) / 1000));
      setRemainingSec(left);
    };
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [activeDuel?.status, activeDuel?.questionStartedAt, activeDuel?.questionTimeLimitMs]);

  if (!backendAvailable) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center space-y-2">
        <Swords className="w-8 h-8 text-slate-400 mx-auto" />
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          Duels momentanément indisponibles
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Les duels en direct ont besoin de la connexion au serveur. Réessayez dans un instant.
        </p>
      </div>
    );
  }

  const subjectLabel = (s: SubjectId | 'all') =>
    s === 'all' ? 'Multi-matières' : SUBJECTS.find((x) => x.id === s)?.label || s;

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // Clipboard indisponible en iframe restreint
    }
  };

  // Vue active d'un duel (salle d'attente, manche live, ou podium final)
  if (activeDuel) {
    const me = activeDuel.participants.find((p) => p.clientId === activeDuel.myClientId);
    const isHost = Boolean(me?.isHost);

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {subjectLabel(activeDuel.subject)} · Niveau {activeDuel.gradeLevel} ·{' '}
              {activeDuel.totalQuestions} questions chrono
            </div>
            <div className="mt-1 flex items-center gap-3">
              <span className="text-xl font-bold font-mono tracking-wider text-slate-900 dark:text-white">
                {activeDuel.code}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(activeDuel.code)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedCode ? 'Copié' : 'Copier le code'}</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onLeaveDuel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 self-start sm:self-auto cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Quitter la salle</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Zone centrale : attente, question active, ou podium */}
          <div className="lg:col-span-8 space-y-4">
            {activeDuel.status === 'waiting' && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Salle d’attente du duel ({activeDuel.participants.length}/6 joueurs)
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Partagez le code <strong className="font-mono">{activeDuel.code}</strong> à vos camarades pour les inviter, ou lancez immédiatement le défi chrono.
                  </p>
                </div>

                {isHost ? (
                  <button
                    type="button"
                    onClick={() => onStartDuel(activeDuel.code)}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${ACCENT_BTN_MAP[accentColor]}`}
                  >
                    <Play className="w-4 h-4" />
                    <span>Lancer le duel maintenant</span>
                  </button>
                ) : (
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    En attente du lancement par l’hôte de la salle...
                  </div>
                )}
              </div>
            )}

            {activeDuel.status === 'active' && activeDuel.currentQuestion && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
                <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Question{' '}
                    <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                      {activeDuel.currentIndex + 1}/{activeDuel.totalQuestions}
                    </span>{' '}
                    · {activeDuel.currentQuestion.chapterTitle}
                  </div>
                  <div
                    className={`inline-flex items-center gap-1.5 text-sm font-bold font-mono tabular-nums ${
                      remainingSec <= 6
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>{remainingSec} s</span>
                  </div>
                </div>

                <p className="text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
                  {activeDuel.currentQuestion.prompt}
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  {(activeDuel.currentQuestion.options || []).map((opt) => {
                    const alreadyAnswered = Boolean(me?.answeredCurrent);
                    const isPicked = pickedOption === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={alreadyAnswered}
                        onClick={() => {
                          setPickedOption(opt);
                          onAnswerDuel(activeDuel.code, activeDuel.currentQuestion!.id, opt);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm rounded-lg border transition-colors cursor-pointer disabled:cursor-default ${
                          isPicked
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {me?.answeredCurrent && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Réponse verrouillée ! En attente des autres participants ou de la fin du chronomètre...
                  </div>
                )}
              </div>
            )}

            {activeDuel.status === 'finished' && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-6 h-6 text-amber-500" />
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Duel terminé — Podium final
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Bonus XP fair-play crédité automatiquement aux élèves connectés ayant au moins 1 bonne réponse.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {activeDuel.participants.map((p, idx) => (
                    <div
                      key={p.clientId}
                      className="py-3 flex items-center justify-between gap-4 text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 text-center font-mono tabular-nums font-bold text-slate-500">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-white truncate">
                            {p.displayName}
                            {p.clientId === activeDuel.myClientId ? ' (Vous)' : ''}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {p.correctCount}/{activeDuel.totalQuestions} bonnes réponses
                            {p.xpAwarded > 0 ? ` · +${p.xpAwarded} XP` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {p.score} pts
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeDuel.lastRoundReveal && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 text-xs space-y-1">
                <div className="font-semibold text-slate-700 dark:text-slate-200">
                  Correction de la question précédente
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  Réponse exacte :{' '}
                  <strong className="text-emerald-700 dark:text-emerald-400">
                    {activeDuel.lastRoundReveal.correctAnswer}
                  </strong>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeDuel.lastRoundReveal.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Tableau des scores en direct */}
          <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <Users className="w-3.5 h-3.5" />
              <span>Classement en direct ({activeDuel.participants.length})</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeDuel.participants.map((p, idx) => (
                <div
                  key={p.clientId}
                  className="py-2.5 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {idx + 1}. {p.displayName}
                      {p.isHost ? ' · Hôte' : ''}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {activeDuel.status === 'active' && p.answeredCurrent ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> Répondu
                        </span>
                      ) : (
                        `Niveau ${p.gradeLevel}`
                      )}
                    </div>
                  </div>
                  <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                    {p.score} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vue Lobby : Créer ou rejoindre un duel
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Créer un duel ou mini-tournoi
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Score pondéré par la rapidité (25 s par question), jusqu’à 6 joueurs en temps réel.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Matière
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value as SubjectId | 'all')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            >
              <option value="all">Toutes les matières (mixte)</option>
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Classe
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                {GRADE_LEVELS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Questions
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                <option value={3}>3 questions (express)</option>
                <option value={5}>5 questions (standard)</option>
                <option value={8}>8 questions (tournoi)</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onCreateDuel({ subject, gradeLevel, questionCount })}
            className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${ACCENT_BTN_MAP[accentColor]}`}
          >
            <Swords className="w-4 h-4" />
            <span>Ouvrir une salle de duel</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            Rejoindre avec un code (ex. EUL-4A9F)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="EUL-XXXX"
              maxLength={12}
              className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
            <button
              type="button"
              disabled={!joinCodeInput.trim()}
              onClick={() => onJoinDuel(joinCodeInput.trim())}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 disabled:opacity-45 whitespace-nowrap cursor-pointer"
            >
              Rejoindre
            </button>
          </div>
          {duelError && (
            <p className="text-xs text-red-600 dark:text-red-400">{duelError}</p>
          )}
        </div>
      </div>

      {/* Liste des salles ouvertes en temps réel */}
      <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Salles ouvertes en direct
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              En direct avec les élèves connectés
            </p>
          </div>
          <button
            type="button"
            onClick={onRefreshLobby}
            className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
          >
            Actualiser
          </button>
        </div>

        {duelLobby.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
            Aucun duel en attente pour l’instant. Créez la première salle à gauche et partagez son code !
          </div>
        ) : (
          <div className="space-y-2.5">
            {duelLobby.map((room) => (
              <div
                key={room.code}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <span className="font-mono">{room.code}</span>
                    <span className="text-slate-400">·</span>
                    <span>{subjectLabel(room.subject)}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Hôte : {room.hostName} · Niveau {room.gradeLevel} · {room.questionCount} questions ·{' '}
                    <span className="font-mono tabular-nums">
                      {room.playerCount}/{room.maxPlayers} joueurs
                    </span>
                  </div>
                </div>

                {room.status === 'waiting' ? (
                  <button
                    type="button"
                    onClick={() => onJoinDuel(room.code)}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap cursor-pointer ${ACCENT_BTN_MAP[accentColor]}`}
                  >
                    Rejoindre
                  </button>
                ) : (
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                    Manche en cours
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
