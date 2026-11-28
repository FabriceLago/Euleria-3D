import React, { useState } from 'react';
import {
  Atom,
  Award,
  BookOpen,
  Box,
  Brain,
  CheckCircle2,
  Compass,
  Database,
  Dna,
  Feather,
  FlaskConical,
  Globe2,
  GraduationCap,
  Landmark,
  Languages,
  Leaf,
  Medal,
  MessageSquare,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import type {
  AccentColor,
  BadgeItem,
  ChapterItem,
  ChapterProgress,
  GradeLevel,
  LeaderboardEntry,
  MistakeItem,
  PredictionMetrics,
  UserProfile,
} from '../types/learning.ts';
import type { PrintableDocument } from '../utils/printExport.tsx';
import { StudyPlanView } from './StudyPlanView.tsx';
import { MistakesNotebookView } from './MistakesNotebookView.tsx';

interface LeaderboardViewProps {
  leaderboard: LeaderboardEntry[];
  profile: UserProfile | null;
  badges: BadgeItem[];
  progress: ChapterProgress[];
  chapters: ChapterItem[];
  selectedGrade: GradeLevel;
  accentColor: AccentColor;
  backendAvailable: boolean;
  totalChaptersCount: number;
  overallPrediction: PredictionMetrics | null;
  sessionMistakes: MistakeItem[];
  onSignIn: () => void;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onOpenChapter: (chapter: ChapterItem) => void;
  onLaunchDynamicQuiz: (chapterId: number) => void;
  onOpenMockExams: () => void;
  onUpdateWeeklyGoal: (goalXp: number) => Promise<void>;
  onMarkSessionMistakeResolved: (key: string) => void;
  onAttemptRecorded: (prog: ChapterProgress, newXp: number, newBadges?: BadgeItem[]) => void;
  onPrintDocument: (doc: PrintableDocument) => void;
  onToggleLeaderboard: (optIn: boolean) => Promise<void>;
}

const BADGE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Atom,
  Award,
  BookOpen,
  Box,
  Brain,
  CheckCircle2,
  Compass,
  Dna,
  Feather,
  FlaskConical,
  Globe2,
  GraduationCap,
  Landmark,
  Languages,
  Leaf,
  Medal,
  TrendingUp,
  MessageSquare,
};

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  leaderboard,
  profile,
  badges,
  progress,
  chapters,
  selectedGrade,
  accentColor,
  backendAvailable,
  totalChaptersCount,
  overallPrediction,
  sessionMistakes,
  onSignIn,
  apiFetch,
  onOpenChapter,
  onLaunchDynamicQuiz,
  onOpenMockExams,
  onUpdateWeeklyGoal,
  onMarkSessionMistakeResolved,
  onAttemptRecorded,
  onPrintDocument,
  onToggleLeaderboard,
}) => {
  const [activeSubView, setActiveSubView] = useState<'plan' | 'mistakes' | 'ranking'>('plan');
  const [savingOptIn, setSavingOptIn] = useState(false);
  const completedCount = progress.filter((p) => p.status === 'completed').length;
  const unresolvedSessionCount = sessionMistakes.filter((m) => !m.resolved).length;
  const optedIn = !!profile?.leaderboardOptIn;
  const toggleOptIn = async () => {
    setSavingOptIn(true);
    try {
      await onToggleLeaderboard(!optedIn);
    } finally {
      setSavingOptIn(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <div className="pb-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {activeSubView === 'plan'
              ? 'Objectifs de la semaine, fiches à revoir et chapitres prioritaires'
              : activeSubView === 'mistakes'
                ? 'Carnet d’erreurs intelligent · Pièges récurrents & remédiation ciblée'
                : 'XP, badges et classement'}
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {activeSubView === 'plan'
              ? 'Plan de révision personnalisé'
              : activeSubView === 'mistakes'
                ? 'Carnet d’erreurs — Mes pièges à éviter'
                : 'Classement, récompenses & prédiction'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setActiveSubView('plan')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSubView === 'plan'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Plan de révision
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView('mistakes')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSubView === 'mistakes'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Carnet d’erreurs</span>
              {unresolvedSessionCount > 0 && (
                <span className="font-mono tabular-nums text-[11px] text-amber-600 dark:text-amber-400">
                  ({unresolvedSessionCount})
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveSubView('ranking')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeSubView === 'ranking'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Classement & Badges
            </button>
          </div>

          {!profile && activeSubView === 'ranking' && (
            <button
              type="button"
              onClick={onSignIn}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Rejoindre le classement
            </button>
          )}
        </div>
      </div>

      {activeSubView === 'plan' ? (
        <StudyPlanView
          chapters={chapters}
          selectedGrade={selectedGrade}
          profile={profile}
          accentColor={accentColor}
          backendAvailable={backendAvailable}
          onSignIn={onSignIn}
          apiFetch={apiFetch}
          onOpenChapter={onOpenChapter}
          onLaunchDynamicQuiz={onLaunchDynamicQuiz}
          onOpenMockExams={onOpenMockExams}
          onUpdateWeeklyGoal={onUpdateWeeklyGoal}
          onPrintDocument={onPrintDocument}
        />
      ) : activeSubView === 'mistakes' ? (
        <MistakesNotebookView
          chapters={chapters}
          profile={profile}
          accentColor={accentColor}
          backendAvailable={backendAvailable}
          sessionMistakes={sessionMistakes}
          onSignIn={onSignIn}
          apiFetch={apiFetch}
          onOpenChapter={onOpenChapter}
          onMarkSessionMistakeResolved={onMarkSessionMistakeResolved}
          onAttemptRecorded={onAttemptRecorded}
        />
      ) : (
        <>

      {/* Synthèse personnelle si connecté */}
      {profile && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className="text-xs text-slate-500 dark:text-slate-400">Expérience totale</div>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white">
              {profile.xp} XP
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className="text-xs text-slate-500 dark:text-slate-400">Chapitres maîtrisés</div>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white">
              {completedCount} / {totalChaptersCount}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Réussite estimée
            </div>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white">
              {overallPrediction?.predictedSuccessRate ?? 50}%
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className="text-xs text-slate-500 dark:text-slate-400">Rapidité de réponse</div>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white">
              {Math.round((overallPrediction?.fluencyFactor ?? 0.5) * 100)}%
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tableau de classement en temps réel */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-white">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Classement académique en direct</span>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {leaderboard.length} élèves classés
            </span>
          </div>

          {/* Opt-in : le classement est désactivé par défaut, et n'affiche qu'un pseudonyme tiré au sort */}
          {profile && (
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <div className="font-semibold text-slate-900 dark:text-white">Apparaître dans le classement</div>
                {optedIn && profile.pseudonym ? (
                  <span>
                    Tu es classé sous le pseudonyme <strong>{profile.pseudonym}</strong>.
                  </span>
                ) : (
                  <span>Désactivé. Si tu l’actives, un pseudonyme te sera attribué au hasard.</span>
                )}{' '}
                Ton nom, ta photo et ta classe ne sont jamais affichés.
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={optedIn}
                aria-label="Apparaître dans le classement"
                disabled={savingOptIn || !backendAvailable}
                onClick={toggleOptIn}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  optedIn ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    optedIn ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          )}

          {leaderboard.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Aucun élève classé pour le moment. Active le classement ci-dessus pour y apparaître.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {leaderboard.map((entry) => {
                const isMe = optedIn && !!profile?.pseudonym && profile.pseudonym === entry.pseudonym;
                return (
                  <div
                    key={entry.pseudonym}
                    className={`px-5 py-3.5 flex items-center justify-between gap-4 ${
                      isMe ? 'bg-indigo-50/70 dark:bg-indigo-950/30' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="w-8 text-xs font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400">
                        #{entry.rank}
                      </span>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {entry.pseudonym} {isMe ? '(toi)' : ''}
                      </div>
                    </div>
                    <div className="text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white shrink-0">
                      {entry.xp} XP
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Colonne droite : Badges & Feuille de route */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Récompenses virtuelles ({badges.filter((b) => b.earned).length}/{badges.length || 18})
            </h2>
            {badges.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connectez-vous pour suivre le déblocage de vos 18 badges d’excellence en temps réel.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {badges.map((badge) => {
                  const Icon = BADGE_ICONS[badge.iconName] || Award;
                  return (
                    <div
                      key={badge.id}
                      className={`rounded-lg border p-3 transition-colors ${
                        badge.earned
                          ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            badge.earned
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        />
                        <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {badge.title}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                        {badge.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Architecture & Prochains cours après validation Mathématiques */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <Database className="w-4 h-4 text-slate-500" />
              <span>Progression du catalogue de cours</span>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    1. Mathématiques Appliquées (6ᵉ → Terminale)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    21 chapitres · 63 exercices · Géométrie, fonctions et probabilités en 3D
                  </div>
                </div>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                  Actif
                </span>
              </div>

              <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    2. Physique-Chimie & Simulations 3D (6ᵉ → Terminale)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    21 chapitres · 63 exercices · Atomes, Molécules, Optique, Circuits & Titrages
                  </div>
                </div>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                  Actif
                </span>
              </div>

              <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    3. Sciences de la Vie et de la Terre — SVT (6ᵉ → Terminale)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    21 chapitres · 63 exercices · Cellules 3D, ADN, Tectonique, Neurones & Climat
                  </div>
                </div>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                  Actif
                </span>
              </div>

              <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    4. Histoire-Géographie (6ᵉ → Terminale)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    21 chapitres · 63 exercices · Monuments 3D, Routes maritimes, Métropoles & Géopolitique
                  </div>
                </div>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                  Actif
                </span>
              </div>

              <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    5. Français, Littérature & Philosophie (6ᵉ → Terminale)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    21 chapitres · 63 exercices · Syntaxe 3D, Théâtre classique, Versification & Philosophie
                  </div>
                </div>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                  Actif
                </span>
              </div>

              <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    6. Anglais — LV1 (6ᵉ → Terminale)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    21 chapitres · 63 exercices · Temps verbaux 3D, Modaux, Culture UK/US & Essays B2
                  </div>
                </div>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
                  Actif
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
