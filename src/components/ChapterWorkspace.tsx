import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Send,
  TrendingUp,
} from 'lucide-react';
import { GRADE_LEVELS } from '../db/curriculumData.ts';
import type {
  AccentColor,
  BadgeItem,
  ChapterItem,
  ChapterProgress,
  GradeLevel,
  LayoutDensity,
  PredictionMetrics,
  ThemeMode,
} from '../types/learning.ts';
import { MathViewport3D } from './MathViewport3D.tsx';

interface ChapterWorkspaceProps {
  chapters: ChapterItem[];
  selectedGrade: GradeLevel;
  onSelectGrade: (grade: GradeLevel) => void;
  selectedChapterId: number | null;
  onSelectChapter: (chapterId: number) => void;
  progressList: ChapterProgress[];
  themeMode: ThemeMode;
  accentColor: AccentColor;
  layoutDensity: LayoutDensity;
  showGrid: boolean;
  isAuthenticated: boolean;
  signingIn?: boolean;
  onRequireSignIn: () => Promise<boolean>;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onAttemptRecorded: (
    prog: ChapterProgress,
    newXp: number,
    newBadges: BadgeItem[]
  ) => void;
}

const ACCENT_RING_MAP: Record<AccentColor, string> = {
  indigo: 'bg-indigo-600 text-white hover:bg-indigo-700',
  emerald: 'bg-emerald-600 text-white hover:bg-emerald-700',
  amber: 'bg-amber-600 text-white hover:bg-amber-700',
  sky: 'bg-sky-600 text-white hover:bg-sky-700',
};

export const ChapterWorkspace: React.FC<ChapterWorkspaceProps> = ({
  chapters,
  selectedGrade,
  onSelectGrade,
  selectedChapterId,
  onSelectChapter,
  progressList,
  themeMode,
  accentColor,
  layoutDensity,
  showGrid,
  isAuthenticated,
  signingIn = false,
  onRequireSignIn,
  apiFetch,
  onAttemptRecorded,
}) => {
  const gradeChapters = useMemo(
    () => chapters.filter((c) => c.gradeLevel === selectedGrade),
    [chapters, selectedGrade]
  );

  const activeChapter = useMemo(() => {
    const found = chapters.find((c) => c.id === selectedChapterId);
    if (found && found.gradeLevel === selectedGrade) return found;
    return gradeChapters[0] || chapters[0] || null;
  }, [chapters, gradeChapters, selectedChapterId, selectedGrade]);

  const progressMap = useMemo(() => {
    const map = new Map<number, ChapterProgress>();
    for (const p of progressList) {
      map.set(p.chapterId, p);
    }
    return map;
  }, [progressList]);

  const [activeExerciseIdx, setActiveExerciseIdx] = useState(0);
  const [answerInput, setAnswerInput] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    explanation: string;
    xpEarned: number;
    prediction?: PredictionMetrics;
    newBadges?: BadgeItem[];
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const startTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    setActiveExerciseIdx(0);
    setAnswerInput('');
    setShowHint(false);
    setFeedback(null);
    setSubmitError(null);
    startTimeRef.current = performance.now();
  }, [activeChapter?.id]);

  const handleSelectExercise = (idx: number) => {
    setActiveExerciseIdx(idx);
    setAnswerInput('');
    setShowHint(false);
    setFeedback(null);
    setSubmitError(null);
    startTimeRef.current = performance.now();
  };

  const activeGradeMeta = GRADE_LEVELS.find((g) => g.id === selectedGrade);
  const activeChapterProg = activeChapter ? progressMap.get(activeChapter.id) : undefined;
  const activeExercise = activeChapter?.exercises[activeExerciseIdx] || null;

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExercise || !answerInput.trim() || submitting || signingIn) return;

    setSubmitting(true);
    setSubmitError(null);

    if (!isAuthenticated) {
      const signedIn = await onRequireSignIn();
      if (!signedIn) {
        setSubmitting(false);
        return;
      }
    }

    const responseTimeMs = Math.round(performance.now() - startTimeRef.current);

    try {
      const res = await apiFetch('/api/progress/attempt', {
        method: 'POST',
        body: JSON.stringify({
          exerciseId: activeExercise.id,
          submittedAnswer: answerInput.trim(),
          responseTimeMs,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la validation.');
      }

      setFeedback({
        isCorrect: data.isCorrect,
        explanation: data.explanation,
        xpEarned: data.xpEarned,
        prediction: data.prediction,
        newBadges: data.newlyUnlockedBadges,
      });

      if (data.progress) {
        onAttemptRecorded(data.progress, data.userXp, data.newlyUnlockedBadges || []);
      }
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Erreur réseau.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeChapter) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-600 dark:text-slate-400">
        Chargement du programme de mathématiques...
      </div>
    );
  }

  const padClass = layoutDensity === 'compact' ? 'p-4' : 'p-6';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* En-tête de section & Sélecteur de niveau 6e -> Terminale */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Mathématiques Appliquées · {activeGradeMeta?.cycle} · {activeGradeMeta?.focus}
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white [text-wrap:balance]">
            Parcours interactif de la 6ᵉ à la Terminale
          </h1>
        </div>

        {/* Sélecteur segmenté de niveau scolaire */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {GRADE_LEVELS.map((grade) => {
            const active = selectedGrade === grade.id;
            return (
              <button
                key={grade.id}
                type="button"
                onClick={() => onSelectGrade(grade.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {grade.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sélecteur de chapitres du niveau actif */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {gradeChapters.map((ch) => {
          const isSelected = ch.id === activeChapter.id;
          const prog = progressMap.get(ch.id);
          const completed = prog?.status === 'completed';
          const mastery = Math.round(prog?.masteryScore ?? 0);

          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => onSelectChapter(ch.id)}
              className={`text-left rounded-xl border ${padClass} transition-colors cursor-pointer ${
                isSelected
                  ? 'border-slate-900 dark:border-white bg-white dark:bg-slate-900 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Chapitre 0{ch.orderIndex} · {ch.estimatedMinutes} min · {ch.xpReward} XP
                </span>
                {completed && (
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Validé
                  </span>
                )}
              </div>
              <div className="mt-1.5 text-base font-semibold text-slate-900 dark:text-white">
                {ch.title}
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {ch.subtitle}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                <span>Maîtrise : {mastery}%</span>
                <span>
                  {prog?.completedExercisesCount ?? 0}/{ch.exercises.length} exercices
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-300"
                  style={{ width: `${mastery}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Espace de travail principal en deux zones (Scène 3D + Quiz/Prédiction) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Colonne gauche : Scène 3D WebGL + Synthèse théorique */}
        <div className="lg:col-span-7 space-y-5">
          <MathViewport3D
            preset={activeChapter.scenePreset}
            chapterTitle={activeChapter.title}
            defaultParams={activeChapter.defaultParams}
            themeMode={themeMode}
            accentColor={accentColor}
            showGrid={showGrid}
          />

          <div
            className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${padClass}`}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <BookOpen className="w-4 h-4 text-slate-500" />
                <span>Fondements théoriques du chapitre</span>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                {activeChapter.formulaDisplay}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {activeChapter.theoryContent}
            </p>
          </div>
        </div>

        {/* Colonne droite : Prédiction temps réel + Exercices & Quiz interactifs */}
        <div className="lg:col-span-5 space-y-5">
          {/* Carte de prédiction bayésienne en temps réel */}
          <div
            className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${padClass}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Prédiction de réussite (Modèle BKT)</span>
              </div>
              <span className="text-lg font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                {Math.round(
                  feedback?.prediction?.predictedSuccessRate ??
                    activeChapterProg?.predictedSuccessRate ??
                    46
                )}
                %
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {feedback?.prediction?.recommendedAction ||
                (isAuthenticated
                  ? 'Calculé en temps réel à partir de vos réponses et de votre temps de résolution.'
                  : 'Connectez-vous pour activer le suivi bayésien et la sauvegarde PostgreSQL.')}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <div className="text-slate-500 dark:text-slate-400">Maîtrise</div>
                <div className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  {Math.round(activeChapterProg?.masteryScore ?? 0)}%
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">Exercices</div>
                <div className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                  {activeChapterProg?.completedExercisesCount ?? 0}/
                  {activeChapter.exercises.length}
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">Statut</div>
                <div className="font-medium text-slate-900 dark:text-white">
                  {activeChapterProg?.status === 'completed'
                    ? 'Maîtrisé'
                    : activeChapterProg?.status === 'in_progress'
                      ? 'En cours'
                      : 'À débuter'}
                </div>
              </div>
            </div>
          </div>

          {/* Zone d'exercice interactif */}
          <div
            className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${padClass}`}
          >
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                Exercices pratiques & Quiz
              </div>
              <div className="flex items-center gap-1">
                {activeChapter.exercises.map((ex, idx) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => handleSelectExercise(idx)}
                    className={`w-7 h-7 rounded-md text-xs font-mono tabular-nums font-semibold transition-colors cursor-pointer ${
                      activeExerciseIdx === idx
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {activeExercise && (
              <form onSubmit={handleSubmitAnswer} className="mt-4 space-y-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {activeExercise.exerciseType === 'quiz' ? 'Quiz interactif' : 'Exercice numérique'}{' '}
                  · +{activeExercise.xpValue} XP
                </div>

                <p className="text-sm font-medium leading-relaxed text-slate-900 dark:text-slate-100">
                  {activeExercise.prompt}
                </p>

                {activeExercise.options ? (
                  <div className="space-y-2">
                    {activeExercise.options.map((opt) => {
                      const chosen = answerInput === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAnswerInput(opt)}
                          className={`w-full text-left px-3.5 py-2.5 text-sm rounded-lg border transition-colors cursor-pointer ${
                            chosen
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-slate-900 dark:text-white font-medium'
                              : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={answerInput}
                      onChange={(e) => setAnswerInput(e.target.value)}
                      placeholder="Saisissez votre résultat numérique (ex: 12 ou 0.75)"
                      className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowHint((h) => !h)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showHint ? 'Masquer l’indice' : 'Afficher un indice'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || signingIn || !answerInput.trim()}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer ${ACCENT_RING_MAP[accentColor]}`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {signingIn
                        ? 'Connexion...'
                        : submitting
                          ? 'Analyse...'
                          : 'Valider la réponse'}
                    </span>
                  </button>
                </div>

                {showHint && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                    Indice : {activeExercise.hint}
                  </div>
                )}

                {submitError && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                    {submitError}
                  </div>
                )}

                {feedback && (
                  <div
                    className={`p-3.5 rounded-lg border text-xs space-y-2 ${
                      feedback.isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    <div className="font-semibold flex items-center justify-between">
                      <span>
                        {feedback.isCorrect
                          ? `Réponse exacte ! (+${feedback.xpEarned} XP)`
                          : 'À retravailler — voici le raisonnement :'}
                      </span>
                      {activeExerciseIdx < activeChapter.exercises.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleSelectExercise(activeExerciseIdx + 1)}
                          className="inline-flex items-center gap-1 underline font-semibold cursor-pointer"
                        >
                          <span>Suivant</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="leading-relaxed">{feedback.explanation}</p>
                    {feedback.newBadges && feedback.newBadges.length > 0 && (
                      <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 flex items-center gap-2 font-semibold">
                        <Award className="w-4 h-4 shrink-0" />
                        <span>
                          Nouveau badge débloqué :{' '}
                          {feedback.newBadges.map((b) => b.title).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
