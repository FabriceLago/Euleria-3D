import React from 'react';
import {
  Atom,
  Award,
  Box,
  CheckCircle2,
  Compass,
  Database,
  FlaskConical,
  MessageSquare,
  Server,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { GRADE_LEVELS } from '../db/curriculumData.ts';
import type {
  BadgeItem,
  ChapterProgress,
  LeaderboardEntry,
  PredictionMetrics,
  UserProfile,
} from '../types/learning.ts';

interface LeaderboardViewProps {
  leaderboard: LeaderboardEntry[];
  profile: UserProfile | null;
  badges: BadgeItem[];
  progress: ChapterProgress[];
  totalChaptersCount: number;
  overallPrediction: PredictionMetrics | null;
  onSignIn: () => void;
}

const BADGE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Atom,
  Award,
  Box,
  CheckCircle2,
  Compass,
  Database,
  FlaskConical,
  Server,
  TrendingUp,
  MessageSquare,
};

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  leaderboard,
  profile,
  badges,
  progress,
  totalChaptersCount,
  overallPrediction,
  onSignIn,
}) => {
  const completedCount = progress.filter((p) => p.status === 'completed').length;
  const gradeLabelMap = new Map<string, string>(GRADE_LEVELS.map((g) => [g.id, g.label]));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <div className="pb-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Gamification · Synchronisation temps réel PostgreSQL & WebSocket
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Classement, récompenses & prédiction
          </h1>
        </div>
        {!profile && (
          <button
            type="button"
            onClick={onSignIn}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Rejoindre le classement
          </button>
        )}
      </div>

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
              Prédiction de réussite globale
            </div>
            <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white">
              {overallPrediction?.predictedSuccessRate ?? 50}%
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className="text-xs text-slate-500 dark:text-slate-400">Indice de fluidité</div>
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
              {leaderboard.length} élèves inscrits
            </span>
          </div>

          {leaderboard.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Aucun élève classé pour le moment. Connectez-vous et complétez un premier exercice pour apparaître en tête.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {leaderboard.map((entry, idx) => {
                const isMe = profile?.uid === entry.uid;
                return (
                  <div
                    key={entry.id}
                    className={`px-5 py-3.5 flex items-center justify-between gap-4 ${
                      isMe ? 'bg-indigo-50/70 dark:bg-indigo-950/30' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="w-6 text-xs font-mono tabular-nums font-bold text-slate-500 dark:text-slate-400">
                        #{idx + 1}
                      </span>
                      {entry.avatarUrl ? (
                        <img
                          src={entry.avatarUrl}
                          alt={entry.displayName}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0">
                          {entry.displayName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {entry.displayName} {isMe ? '(Vous)' : ''}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Classe : {gradeLabelMap.get(entry.gradeLevel) || entry.gradeLevel}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {entry.xp} XP
                      </div>
                      <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {entry.streakDays} j. série
                      </div>
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
              Récompenses virtuelles ({badges.filter((b) => b.earned).length}/{badges.length || 10})
            </h2>
            {badges.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connectez-vous pour suivre le déblocage de vos 10 badges d’excellence en temps réel.
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
                    21 chapitres · 63 exercices · Modèles WebGL 3D & Prédiction BKT
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
                    3. Bases de données relationnelles & SQL (6ᵉ → Terminale)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    21 chapitres · 63 exercices · Tables, Jointures, 3NF, B-Tree & ACID
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
    </div>
  );
};
