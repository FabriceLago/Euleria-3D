import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { ALL_SEED_CHAPTERS, SUBJECTS } from '../db/curriculumData.ts';
import { evaluateExerciseAnswer } from '../services/predictionEngine.ts';
import type {
  AccentColor,
  BadgeItem,
  ChapterItem,
  ChapterProgress,
  MistakeItem,
  MistakesNotebookData,
  UserProfile,
} from '../types/learning.ts';

interface MistakesNotebookViewProps {
  chapters: ChapterItem[];
  profile: UserProfile | null;
  accentColor: AccentColor;
  backendAvailable: boolean;
  sessionMistakes: MistakeItem[];
  onSignIn: () => void;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onOpenChapter: (chapter: ChapterItem) => void;
  onMarkSessionMistakeResolved: (key: string) => void;
  onAttemptRecorded: (prog: ChapterProgress, newXp: number, newBadges?: BadgeItem[]) => void;
}

const ACCENT_BTN_MAP: Record<AccentColor, string> = {
  indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  amber: 'bg-amber-600 hover:bg-amber-700 text-white',
  sky: 'bg-sky-600 hover:bg-sky-700 text-white',
};

export const MistakesNotebookView: React.FC<MistakesNotebookViewProps> = ({
  chapters,
  profile,
  accentColor,
  backendAvailable,
  sessionMistakes,
  onSignIn,
  apiFetch,
  onOpenChapter,
  onMarkSessionMistakeResolved,
  onAttemptRecorded,
}) => {
  const [serverData, setServerData] = useState<MistakesNotebookData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'unresolved' | 'resolved'>('unresolved');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Mode "Refaire uniquement mes erreurs"
  const [drillQueue, setDrillQueue] = useState<MistakeItem[] | null>(null);
  const [drillIdx, setDrillIdx] = useState<number>(0);
  const [drillInput, setDrillInput] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [drillFeedback, setDrillFeedback] = useState<{
    isCorrect: boolean;
    explanation: string;
    xpEarned: number;
  } | null>(null);

  const fetchMistakes = useCallback(async () => {
    if (!profile || !backendAvailable) {
      setServerData(null);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/api/me/mistakes');
      if (res.ok) {
        const data = (await res.json()) as MistakesNotebookData;
        setServerData(data);
      }
    } catch {
      // Non-blocking fallback to session mistakes
    } finally {
      setLoading(false);
    }
  }, [profile, backendAvailable, apiFetch]);

  useEffect(() => {
    fetchMistakes();
  }, [fetchMistakes]);

  // Fusionne les erreurs PostgreSQL + les erreurs de la session (quiz dynamiques / examens blancs / mode invité)
  const merged = useMemo(() => {
    const map = new Map<string, MistakeItem>();
    for (const item of serverData?.unresolved || []) {
      map.set(item.key, item);
    }
    for (const item of serverData?.resolved || []) {
      if (!map.has(item.key)) map.set(item.key, item);
    }
    for (const item of sessionMistakes) {
      const existing = map.get(item.key);
      if (!existing) {
        map.set(item.key, item);
      } else if (!item.resolved && existing.resolved) {
        map.set(item.key, { ...existing, resolved: false, wrongCount: existing.wrongCount + 1 });
      } else if (item.resolved) {
        map.set(item.key, { ...existing, resolved: true });
      }
    }

    const all = Array.from(map.values()).sort(
      (a, b) => new Date(b.lastWrongAt).getTime() - new Date(a.lastWrongAt).getTime()
    );
    const unresolved = all.filter((m) => !m.resolved);
    const resolved = all.filter((m) => m.resolved);
    return { unresolved, resolved, all };
  }, [serverData, sessionMistakes]);

  const chapterMap = useMemo(
    () => new Map<number, ChapterItem>(chapters.map((c) => [c.id, c])),
    [chapters]
  );

  const subjectLabelMap = useMemo(
    () => new Map<string, string>(SUBJECTS.map((s) => [s.id, s.label])),
    []
  );

  const visibleItems = useMemo(() => {
    const base = statusFilter === 'unresolved' ? merged.unresolved : merged.resolved;
    if (subjectFilter === 'all') return base;
    return base.filter((m) => m.subject === subjectFilter);
  }, [merged, statusFilter, subjectFilter]);

  const totalTracked = merged.unresolved.length + merged.resolved.length;
  const remediationPct =
    totalTracked > 0 ? Math.round((merged.resolved.length / totalTracked) * 100) : 100;

  const startDrill = (items: MistakeItem[]) => {
    if (items.length === 0) return;
    setDrillQueue(items);
    setDrillIdx(0);
    setDrillInput('');
    setShowHint(false);
    setDrillFeedback(null);
  };

  const activeDrillItem = drillQueue ? drillQueue[drillIdx] || null : null;

  const handleSubmitDrill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDrillItem || !drillInput.trim() || submitting || drillFeedback) return;

    setSubmitting(true);
    try {
      if (profile && backendAvailable && activeDrillItem.exerciseId) {
        const res = await apiFetch('/api/progress/attempt', {
          method: 'POST',
          body: JSON.stringify({
            exerciseId: activeDrillItem.exerciseId,
            submittedAnswer: drillInput.trim(),
            responseTimeMs: 8000,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setDrillFeedback({
            isCorrect: Boolean(data.isCorrect),
            explanation: data.explanation || activeDrillItem.explanation,
            xpEarned: Number(data.xpEarned) || 0,
          });
          if (data.progress) {
            onAttemptRecorded(data.progress, data.userXp, data.newlyUnlockedBadges || []);
          }
          if (data.isCorrect) {
            onMarkSessionMistakeResolved(activeDrillItem.key);
            fetchMistakes();
          }
          return;
        }
      }

      // Évaluation locale pour erreurs de quiz/examen ou mode hors-ligne
      let expected = activeDrillItem.correctAnswer || '';
      let tolerance = 0.05;
      if (!expected) {
        const ch = chapterMap.get(activeDrillItem.chapterId);
        const seedCh = ch ? ALL_SEED_CHAPTERS.find((s) => s.slug === ch.slug) : null;
        const seedEx = seedCh?.exercises.find((ex) => ex.prompt === activeDrillItem.prompt);
        if (seedEx) {
          expected = seedEx.correctAnswer;
          tolerance = seedEx.numericTolerance ?? 0.05;
        }
      }

      const isCorrect = expected
        ? evaluateExerciseAnswer(activeDrillItem.exerciseType, drillInput.trim(), expected, tolerance)
        : false;

      setDrillFeedback({
        isCorrect,
        explanation: activeDrillItem.explanation,
        xpEarned: 0,
      });

      if (isCorrect) {
        onMarkSessionMistakeResolved(activeDrillItem.key);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextDrill = () => {
    if (!drillQueue) return;
    if (drillIdx + 1 >= drillQueue.length) {
      setDrillQueue(null);
      setDrillIdx(0);
      setDrillInput('');
      setDrillFeedback(null);
      fetchMistakes();
      return;
    }
    setDrillIdx((i) => i + 1);
    setDrillInput('');
    setShowHint(false);
    setDrillFeedback(null);
  };

  if (drillQueue && activeDrillItem) {
    return (
      <div className="max-w-3xl mx-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Session ciblée « Mes pièges à éviter » · Question{' '}
              <span className="font-mono tabular-nums">
                {drillIdx + 1}/{drillQueue.length}
              </span>
            </div>
            <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
              {activeDrillItem.chapterTitle} ·{' '}
              {subjectLabelMap.get(activeDrillItem.subject) || activeDrillItem.subject}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setDrillQueue(null)}
            className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            Quitter
          </button>
        </div>

        <p className="text-sm sm:text-base font-medium text-slate-900 dark:text-white leading-relaxed">
          {activeDrillItem.prompt}
        </p>

        {activeDrillItem.lastSubmittedAnswer && (
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Dernière erreur enregistrée :{' '}
            <span className="font-mono text-red-600 dark:text-red-400">
              {activeDrillItem.lastSubmittedAnswer}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmitDrill} className="space-y-4">
          {activeDrillItem.exerciseType === 'quiz' && activeDrillItem.options ? (
            <div className="space-y-2">
              {activeDrillItem.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  disabled={Boolean(drillFeedback)}
                  onClick={() => setDrillInput(opt)}
                  className={`w-full text-left px-4 py-2.5 text-sm rounded-lg border transition-colors cursor-pointer ${
                    drillInput === opt
                      ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium'
                      : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <input
              type="text"
              value={drillInput}
              disabled={Boolean(drillFeedback)}
              onChange={(e) => setDrillInput(e.target.value)}
              placeholder="Saisissez votre nouvelle réponse..."
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowHint((h) => !h)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showHint ? 'Masquer l’indice' : 'Afficher l’indice'}</span>
            </button>

            {!drillFeedback ? (
              <button
                type="submit"
                disabled={!drillInput.trim() || submitting}
                className={`px-5 py-2 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer ${ACCENT_BTN_MAP[accentColor]}`}
              >
                {submitting ? 'Vérification...' : 'Valider ma correction'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextDrill}
                className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${ACCENT_BTN_MAP[accentColor]}`}
              >
                <span>
                  {drillIdx + 1 >= drillQueue.length ? 'Terminer la session' : 'Erreur suivante'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>

        {showHint && activeDrillItem.hint && (
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs text-slate-600 dark:text-slate-300">
            <strong>Indice :</strong> {activeDrillItem.hint}
          </div>
        )}

        {drillFeedback && (
          <div
            className={`p-4 rounded-lg border text-xs leading-relaxed ${
              drillFeedback.isCorrect
                ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                : 'border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/30 text-red-900 dark:text-red-200'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold mb-1">
              {drillFeedback.isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Piège maîtrisé !{' '}
                    {drillFeedback.xpEarned > 0 ? `(+${drillFeedback.xpEarned} XP)` : ''}
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span>Encore un effort — cette question reste dans vos pièges actifs.</span>
                </>
              )}
            </div>
            <p>{drillFeedback.explanation}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Pièges à retravailler</div>
          <div className="mt-1 text-3xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {merged.unresolved.length}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Questions ratées non encore re-validées
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Erreurs corrigées</div>
          <div className="mt-1 text-3xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {merged.resolved.length}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Notions transformées en acquis solides
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Taux de remédiation</div>
          <div className="mt-1 text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {remediationPct}%
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {/* phrase entière dans un seul nœud texte : traduisible avec son pluriel */}
            {totalTracked > 1 ? `Sur ${totalTracked} erreurs suivies` : `Sur ${totalTracked} erreur suivie`}
          </div>
        </div>
      </div>

      {/* Barre d'actions et filtres */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setStatusFilter('unresolved')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                statusFilter === 'unresolved'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              À retravailler ({merged.unresolved.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('resolved')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                statusFilter === 'resolved'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Corrigées ({merged.resolved.length})
            </button>
          </div>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            aria-label="Filtrer par matière"
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
          >
            <option value="all">Toutes les matières</option>
            {SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          disabled={merged.unresolved.length === 0}
          onClick={() =>
            startDrill(
              subjectFilter === 'all'
                ? merged.unresolved
                : merged.unresolved.filter((m) => m.subject === subjectFilter)
            )
          }
          className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors disabled:opacity-45 whitespace-nowrap shrink-0 cursor-pointer ${ACCENT_BTN_MAP[accentColor]}`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refaire uniquement mes erreurs</span>
        </button>
      </div>

      {!profile && backendAvailable && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            En mode exploration, vos erreurs de cette session apparaissent ici automatiquement. Connectez-vous pour retrouver tout votre historique d’erreurs.
          </p>
          <button
            type="button"
            onClick={onSignIn}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Connexion Google
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
          Analyse de votre carnet d’erreurs...
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {statusFilter === 'unresolved'
              ? 'Aucun piège actif pour le moment'
              : 'Aucune erreur corrigée dans cette sélection'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Dès qu’une réponse est incorrecte dans un exercice, un quiz dynamique ou un examen blanc, elle est enregistrée ici pour une révision ciblée.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => {
            const chapter = chapterMap.get(item.chapterId);
            return (
              <div
                key={item.key}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {subjectLabelMap.get(item.subject) || item.subject}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Niveau {item.gradeLevel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.chapterTitle}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {item.wrongCount > 1 ? `${item.wrongCount} erreurs` : `${item.wrongCount} erreur`}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                    {item.prompt}
                  </p>

                  <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    {item.resolved ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Corrigée lors d’une tentative ultérieure</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>
                          Dernière réponse saisie :{' '}
                          <span className="font-mono text-red-600 dark:text-red-400">
                            {item.lastSubmittedAnswer}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!item.resolved && (
                    <button
                      type="button"
                      onClick={() => startDrill([item])}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${ACCENT_BTN_MAP[accentColor]}`}
                    >
                      Refaire
                    </button>
                  )}
                  {chapter && (
                    <button
                      type="button"
                      onClick={() => onOpenChapter(chapter)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Revoir le cours</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
