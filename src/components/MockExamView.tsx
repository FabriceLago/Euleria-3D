import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  GraduationCap,
  Medal,
  RefreshCw,
  Send,
  XCircle,
} from 'lucide-react';
import { ALL_SEED_CHAPTERS } from '../db/curriculumData.ts';
import {
  buildMockExamQuestions,
  getExamPresetBySlug,
  gradeMockExam,
  MOCK_EXAM_PRESETS,
  sanitizeExamQuestions,
  SUBJECT_DISPLAY_LABELS,
  type ExamHistoryEntry,
  type ExamMention,
  type GeneratedExamQuestion,
  type GradedExamReport,
  type MockExamPreset,
  type PublicExamQuestion,
} from '../services/mockExamEngine.ts';
import type { SeedChapterExerciseRef } from '../services/dynamicQuizEngine.ts';
import type {
  AccentColor,
  BadgeItem,
  ChapterItem,
  GradeLevel,
  UserProfile,
} from '../types/learning.ts';

interface MockExamViewProps {
  chapters: ChapterItem[];
  profile: UserProfile | null;
  accentColor: AccentColor;
  backendAvailable: boolean;
  onSignIn: () => Promise<boolean>;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onXpSynced: (newTotalXp: number, newBadges: BadgeItem[]) => void;
}

interface ActiveExamMeta {
  slug: string;
  title: string;
  shortLabel: string;
  gradeLabel: string;
  timeLimitSec: number;
  questionCount: number;
}

interface SubmittedExamPayload extends GradedExamReport {
  persisted: boolean;
  userXp: number | null;
  newlyUnlockedBadges: BadgeItem[];
}

const ACCENT_BTN_MAP: Record<AccentColor, string> = {
  indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  amber: 'bg-amber-600 hover:bg-amber-700 text-white',
  sky: 'bg-sky-600 hover:bg-sky-700 text-white',
};

function formatCountdown(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function formatDurationLabel(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} s`;
  return `${mins} min ${String(secs).padStart(2, '0')} s`;
}

function formatScore20(score: number): string {
  return score.toFixed(1).replace('.', ',');
}

function mentionToneClass(mention: ExamMention): string {
  if (mention === 'Très Bien' || mention === 'Bien') {
    return 'text-emerald-700 dark:text-emerald-300';
  }
  if (mention === 'Assez Bien' || mention === 'Admis') {
    return 'text-sky-700 dark:text-sky-300';
  }
  return 'text-amber-700 dark:text-amber-300';
}

function subjectStatusLabel(scoreOn20: number): { label: string; className: string } {
  if (scoreOn20 >= 15) {
    return { label: 'Maîtrisé', className: 'text-emerald-700 dark:text-emerald-300' };
  }
  if (scoreOn20 >= 10) {
    return { label: 'En bonne voie', className: 'text-sky-700 dark:text-sky-300' };
  }
  return { label: 'À retravailler', className: 'text-amber-700 dark:text-amber-300' };
}

export const MockExamView: React.FC<MockExamViewProps> = ({
  chapters,
  profile,
  accentColor,
  backendAvailable,
  onSignIn,
  apiFetch,
  onXpSynced,
}) => {
  const [phase, setPhase] = useState<'catalog' | 'active' | 'report'>('catalog');
  const [collegeGrade, setCollegeGrade] = useState<GradeLevel>('6e');
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active exam state
  const [examSessionId, setExamSessionId] = useState<string | null>(null);
  const [activeExam, setActiveExam] = useState<ActiveExamMeta | null>(null);
  const [questions, setQuestions] = useState<PublicExamQuestion[]>([]);
  const [localAnswerKey, setLocalAnswerKey] = useState<GeneratedExamQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const [remainingSec, setRemainingSec] = useState<number>(0);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Graded report state
  const [report, setReport] = useState<SubmittedExamPayload | null>(null);
  const [correctionFilter, setCorrectionFilter] = useState<'all' | 'errors'>('all');

  // Cloud SQL Exam history state
  const [history, setHistory] = useState<ExamHistoryEntry[]>([]);
  const [historySummary, setHistorySummary] = useState<{
    totalExams: number;
    bestScoreOn20: number | null;
    averageScoreOn20: number | null;
  }>({ totalExams: 0, bestScoreOn20: null, averageScoreOn20: null });
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const startedAtRef = useRef<number>(Date.now());
  const autoSubmitTriggeredRef = useRef<boolean>(false);

  const fetchExamHistory = useCallback(async () => {
    if (!profile || !backendAvailable) {
      setHistory([]);
      setHistorySummary({ totalExams: 0, bestScoreOn20: null, averageScoreOn20: null });
      return;
    }
    setLoadingHistory(true);
    try {
      const res = await apiFetch('/api/exams/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data.history) ? data.history : []);
        if (data.summary) setHistorySummary(data.summary);
      }
    } catch {
      // Silencieux : l'historique reste optionnel
    } finally {
      setLoadingHistory(false);
    }
  }, [profile, backendAvailable, apiFetch]);

  useEffect(() => {
    fetchExamHistory();
  }, [fetchExamHistory]);

  // Synchronise le niveau collège par défaut si l'élève est en 6e, 5e ou 4e
  useEffect(() => {
    if (profile && (profile.gradeLevel === '6e' || profile.gradeLevel === '5e' || profile.gradeLevel === '4e')) {
      setCollegeGrade(profile.gradeLevel);
    }
  }, [profile]);

  const handleSubmitExam = useCallback(async () => {
    if (!activeExam || submitting) return;
    setSubmitting(true);
    setConfirmSubmitOpen(false);
    setErrorMsg(null);

    const elapsedSeconds = Math.max(
      1,
      Math.min(activeExam.timeLimitSec, Math.round((Date.now() - startedAtRef.current) / 1000))
    );

    try {
      if (backendAvailable && examSessionId && !examSessionId.startsWith('local-exam-')) {
        const res = await apiFetch('/api/exams/submit', {
          method: 'POST',
          body: JSON.stringify({
            examSessionId,
            answers,
            elapsedSeconds,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Impossible de corriger la copie.');
        }

        const graded: SubmittedExamPayload = {
          examSlug: data.examSlug,
          examTitle: data.examTitle,
          gradeLabel: data.gradeLabel,
          scoreOn20: data.scoreOn20,
          correctCount: data.correctCount,
          totalQuestions: data.totalQuestions,
          mention: data.mention,
          durationSeconds: data.durationSeconds,
          xpAwarded: data.xpAwarded,
          subjectBreakdown: data.subjectBreakdown || [],
          corrections: data.corrections || [],
          persisted: Boolean(data.persisted),
          userXp: typeof data.userXp === 'number' ? data.userXp : null,
          newlyUnlockedBadges: Array.isArray(data.newlyUnlockedBadges)
            ? data.newlyUnlockedBadges
            : [],
        };

        setReport(graded);
        setCorrectionFilter('all');
        setPhase('report');

        if (typeof graded.userXp === 'number') {
          onXpSynced(graded.userXp, graded.newlyUnlockedBadges);
        }
        if (graded.persisted) {
          fetchExamHistory();
        }
      } else {
        const preset = getExamPresetBySlug(activeExam.slug) || MOCK_EXAM_PRESETS[0];
        const localReport = gradeMockExam({
          preset,
          gradeLabel: activeExam.gradeLabel,
          questions: localAnswerKey,
          answers,
          durationSeconds: elapsedSeconds,
        });
        setReport({
          ...localReport,
          persisted: false,
          userXp: null,
          newlyUnlockedBadges: [],
        });
        setCorrectionFilter('all');
        setPhase('report');
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erreur lors de la correction de l’examen.'
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    activeExam,
    submitting,
    backendAvailable,
    examSessionId,
    apiFetch,
    answers,
    onXpSynced,
    fetchExamHistory,
    localAnswerKey,
  ]);

  // Compte à rebours en direct pendant l'épreuve
  useEffect(() => {
    if (phase !== 'active') return;
    const timer = window.setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          if (!autoSubmitTriggeredRef.current) {
            autoSubmitTriggeredRef.current = true;
            handleSubmitExam();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, handleSubmitExam]);

  const handleStartExam = async (preset: MockExamPreset) => {
    setLoadingSlug(preset.slug);
    setErrorMsg(null);
    autoSubmitTriggeredRef.current = false;
    const requestedGrade = preset.selectableGrades ? collegeGrade : undefined;

    try {
      if (backendAvailable) {
        const res = await apiFetch('/api/exams/start', {
          method: 'POST',
          body: JSON.stringify({
            examSlug: preset.slug,
            gradeLevel: requestedGrade,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Impossible de lancer l’examen blanc.');
        }

        setExamSessionId(data.examSessionId);
        setActiveExam(data.exam);
        setQuestions(data.questions || []);
        setLocalAnswerKey([]);
        setCurrentIdx(0);
        setAnswers({});
        setFlaggedIds(new Set());
        setRemainingSec(data.exam?.timeLimitSec ?? preset.timeLimitSec);
        setConfirmSubmitOpen(false);
        setReport(null);
        startedAtRef.current = Date.now();
        setPhase('active');
      } else {
        const exercisesMap = new Map<number, SeedChapterExerciseRef[]>();
        chapters.forEach((ch) => {
          const seed = ALL_SEED_CHAPTERS.find((s) => s.slug === ch.slug);
          if (!seed) return;
          exercisesMap.set(
            ch.id,
            seed.exercises.map((ex) => ({
              chapterId: ch.id,
              orderIndex: ex.orderIndex,
              exerciseType: ex.exerciseType,
              prompt: ex.prompt,
              hint: ex.hint,
              options: ex.options,
              correctAnswer: ex.correctAnswer,
              numericTolerance: ex.numericTolerance,
              explanation: ex.explanation,
              xpValue: ex.xpValue,
            }))
          );
        });

        const built = buildMockExamQuestions({
          preset,
          allChapters: chapters,
          exercisesMap,
          requestedGrade,
        });

        setExamSessionId(`local-exam-${Date.now()}`);
        setActiveExam({
          slug: preset.slug,
          title: preset.title,
          shortLabel: preset.shortLabel,
          gradeLabel: built.gradeLabel,
          timeLimitSec: preset.timeLimitSec,
          questionCount: built.questions.length,
        });
        setLocalAnswerKey(built.questions);
        setQuestions(sanitizeExamQuestions(built.questions));
        setCurrentIdx(0);
        setAnswers({});
        setFlaggedIds(new Set());
        setRemainingSec(preset.timeLimitSec);
        setConfirmSubmitOpen(false);
        setReport(null);
        startedAtRef.current = Date.now();
        setPhase('active');
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Erreur lors du chargement de l’épreuve.'
      );
    } finally {
      setLoadingSlug(null);
    }
  };

  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.id] || '').trim().length > 0).length,
    [questions, answers]
  );

  const unansweredCount = questions.length - answeredCount;
  const activeQuestion = questions[currentIdx] || null;

  const toggleFlag = (questionId: string) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const filteredCorrections = useMemo(() => {
    if (!report) return [];
    if (correctionFilter === 'errors') {
      return report.corrections.filter((c) => !c.isCorrect);
    }
    return report.corrections;
  }, [report, correctionFilter]);

  // =========================================================================
  // PHASE 1 : CATALOGUE DES EXAMENS BLANCS & HISTORIQUE
  // =========================================================================
  if (phase === 'catalog') {
    return (
      <div className="space-y-8">
        {errorMsg && (
          <div className="p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-sm text-red-700 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Colonne gauche : Sélection d'une épreuve officielle */}
          <div className="lg:col-span-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Épreuves chronométrées multi-matières
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Sujets renouvelés à chaque session, navigation libre entre questions, note sur 20 et mention officielle.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_EXAM_PRESETS.map((preset) => {
                const isStarting = loadingSlug === preset.slug;
                const subjectListText = preset.subjects
                  .map((s) => SUBJECT_DISPLAY_LABELS[s])
                  .join(' · ');

                return (
                  <article
                    key={preset.slug}
                    className="flex flex-col justify-between p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        <span>{preset.cycleLabel}</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span>{preset.questionCount} questions</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span>{Math.round(preset.timeLimitSec / 60)} min</span>
                      </div>

                      <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                        {preset.title}
                      </h3>

                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {preset.description}
                      </p>

                      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {subjectListText}
                      </p>

                      {preset.selectableGrades && (
                        <div className="mt-4 flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            Niveau :
                          </span>
                          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                            {preset.selectableGrades.map((g) => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setCollegeGrade(g)}
                                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                                  collegeGrade === g
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        Barème /20 · Mention
                      </span>
                      <button
                        type="button"
                        disabled={Boolean(loadingSlug)}
                        onClick={() => handleStartExam(preset)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 cursor-pointer ${ACCENT_BTN_MAP[accentColor]}`}
                      >
                        {isStarting ? 'Préparation...' : 'Lancer l’épreuve'}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Colonne droite : Historique & statistiques des examens blancs */}
          <aside className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Relevé d’examens blancs
                </h3>
              </div>
              {historySummary.totalExams > 0 && (
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {historySummary.totalExams} copie{historySummary.totalExams > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {!profile ? (
              <div className="space-y-3 py-2">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Vous pouvez passer toutes les épreuves en mode exploration. Connectez-vous avec Google pour archiver vos notes sur 20, gagner jusqu’à 300 XP par copie et débloquer le badge Lauréat d’examen blanc.
                </p>
                <button
                  type="button"
                  onClick={onSignIn}
                  className={`w-full px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${ACCENT_BTN_MAP[accentColor]}`}
                >
                  Se connecter pour sauvegarder mes copies
                </button>
              </div>
            ) : loadingHistory ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
                Chargement de votre relevé d’examens...
              </p>
            ) : history.length === 0 ? (
              <div className="space-y-2 py-2">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Aucune copie rendue pour le moment. Lancez un Brevet blanc, un Bac blanc ou un bilan de classe pour obtenir votre première moyenne sur 20.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Objectif badge : 14,0 / 20 (Mention Bien) débloque « Lauréat d’examen blanc ».
                </p>
              </div>
            ) : (
              <>
                {/* Synthèse chiffrée en tabular-nums */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Moyenne générale</div>
                    <div className="mt-1 text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                      {historySummary.averageScoreOn20 !== null
                        ? `${formatScore20(historySummary.averageScoreOn20)} / 20`
                        : '—'}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-slate-500 dark:text-slate-400">Meilleure note</div>
                    <div className="mt-1 text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                      {historySummary.bestScoreOn20 !== null
                        ? `${formatScore20(historySummary.bestScoreOn20)} / 20`
                        : '—'}
                    </div>
                  </div>
                </div>

                {/* Liste des copies récentes */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {history.slice(0, 6).map((item) => (
                    <div key={item.id} className="py-3 first:pt-1 last:pb-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {item.examTitle}
                        </p>
                        <span className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white shrink-0">
                          {formatScore20(item.scoreOn20)}/20
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className={`font-medium ${mentionToneClass(item.mention)}`}>
                          {item.mention}
                        </span>
                        <span className="tabular-nums">
                          {item.gradeLabel} · {formatDurationLabel(item.durationSeconds)} · +{item.xpAwarded} XP
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    );
  }

  // =========================================================================
  // PHASE 2 : ÉPREUVE EN COURS (CHRONOMÉTRÉE + FEUILLE DE NAVIGATION)
  // =========================================================================
  if (phase === 'active' && activeExam && activeQuestion) {
    const lowTime = remainingSec <= 120;
    const isFlagged = flaggedIds.has(activeQuestion.id);
    const currentValue = answers[activeQuestion.id] || '';

    return (
      <div className="space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-sm text-red-700 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Barre d'état d'examen */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span>{activeExam.gradeLabel}</span>
              <span className="mx-1.5" aria-hidden="true">·</span>
              <span className="tabular-nums">
                {answeredCount} / {questions.length} répondues
              </span>
              {flaggedIds.size > 0 && (
                <>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {flaggedIds.size} à revoir
                  </span>
                </>
              )}
            </div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white truncate">
              {activeExam.title}
            </h2>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div
              className={`inline-flex items-center gap-1.5 text-sm font-semibold font-mono tabular-nums ${
                lowTime
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatCountdown(remainingSec)}</span>
              {lowTime && <span className="font-sans text-xs font-medium">Temps limité</span>}
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                if (unansweredCount > 0) {
                  setConfirmSubmitOpen(true);
                } else {
                  handleSubmitExam();
                }
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 cursor-pointer ${ACCENT_BTN_MAP[accentColor]}`}
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Correction...' : 'Rendre la copie'}
            </button>
          </div>
        </div>

        {/* Confirmation inline si des questions sont laissées blanches (jamais de window.confirm) */}
        {confirmSubmitOpen && (
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-2.5 text-sm text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Il reste <strong className="font-mono tabular-nums">{unansweredCount}</strong> question{unansweredCount > 1 ? 's' : ''} sans réponse. Voulez-vous tout de même rendre votre copie maintenant ?
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmSubmitOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
              >
                Continuer l’épreuve
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmitExam}
                className="px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 whitespace-nowrap cursor-pointer"
              >
                Confirmer et corriger
              </button>
            </div>
          </div>
        )}

        {/* Deux zones : feuille d'examen (8 cols) + grille de navigation (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Feuille de question courante */}
          <section className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Question {currentIdx + 1} sur {questions.length}
                  </span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span>{activeQuestion.subjectLabel}</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span>{activeQuestion.chapterTitle}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleFlag(activeQuestion.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isFlagged
                    ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                {isFlagged ? 'Marquée à revoir' : 'Marquer à revoir'}
              </button>
            </div>

            <p className="text-base sm:text-lg font-medium text-slate-900 dark:text-white leading-relaxed">
              {activeQuestion.prompt}
            </p>

            {/* Réponse : QCM ou saisie numérique/texte */}
            {activeQuestion.exerciseType === 'quiz' && activeQuestion.options ? (
              <div className="space-y-2.5">
                {activeQuestion.options.map((opt, idx) => {
                  const selected = currentValue === opt;
                  const letter = String.fromCharCode(65 + idx);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [activeQuestion.id]: opt }))
                      }
                      className={`w-full text-left px-4 py-3.5 rounded-lg border transition-colors flex items-center gap-3 cursor-pointer ${
                        selected
                          ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-md text-xs font-mono font-semibold flex items-center justify-center shrink-0 ${
                          selected
                            ? 'bg-white/20 dark:bg-slate-900/15'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="text-sm">{opt}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                <label
                  htmlFor="exam-numeric-answer"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Votre réponse (valeur numérique ou expression exacte)
                </label>
                <input
                  id="exam-numeric-answer"
                  type="text"
                  value={currentValue}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [activeQuestion.id]: e.target.value,
                    }))
                  }
                  placeholder="Saisissez votre réponse..."
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                />
              </div>
            )}

            {/* Navigation Précédente / Suivante */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 whitespace-nowrap cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Précédente
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 whitespace-nowrap cursor-pointer"
                >
                  Question suivante
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    if (unansweredCount > 0) setConfirmSubmitOpen(true);
                    else handleSubmitExam();
                  }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${ACCENT_BTN_MAP[accentColor]}`}
                >
                  <Send className="w-3.5 h-3.5" />
                  Terminer et rendre la copie
                </button>
              )}
            </div>
          </section>

          {/* Grille de navigation de la copie */}
          <aside className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Planche de réponses
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cliquez sur un numéro pour revenir librement sur n’importe quelle question.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIdx;
                const isAnswered = (answers[q.id] || '').trim().length > 0;
                const flagged = flaggedIds.has(q.id);
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    aria-label={`Question ${idx + 1}${isAnswered ? ', répondue' : ', sans réponse'}${flagged ? ', marquée à revoir' : ''}`}
                    className={`relative h-10 rounded-lg border text-xs font-mono font-semibold tabular-nums transition-colors flex items-center justify-center cursor-pointer ${
                      isCurrent
                        ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : isAnswered
                          ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {idx + 1}
                    {flagged && (
                      <Flag className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between">
                <span>Questions répondues</span>
                <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-white">
                  {answeredCount} / {questions.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>À relire (drapeau)</span>
                <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-white">
                  {flaggedIds.size}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setPhase('catalog');
                setActiveExam(null);
                setQuestions([]);
                setConfirmSubmitOpen(false);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Quitter l’épreuve sans rendre
            </button>
          </aside>
        </div>
      </div>
    );
  }

  // =========================================================================
  // PHASE 3 : COPIE CORRIGÉE, NOTE /20, MENTION & BULLETIN PAR MATIÈRE
  // =========================================================================
  if (phase === 'report' && report) {
    const presetForRetry = getExamPresetBySlug(report.examSlug);
    const errorCount = report.corrections.filter((c) => !c.isCorrect).length;

    return (
      <div className="space-y-8">
        {/* Bandeau de résultat officiel */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <span>Copie corrigée</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>{report.gradeLabel}</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span className="tabular-nums">{formatDurationLabel(report.durationSeconds)}</span>
              </div>
              <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {report.examTitle}
              </h2>
              <p className={`mt-2 text-sm font-semibold ${mentionToneClass(report.mention)}`}>
                Mention : {report.mention}
              </p>
            </div>

            <div className="flex items-center gap-6 shrink-0">
              <div className="text-right">
                <div className="text-xs text-slate-500 dark:text-slate-400">Note finale</div>
                <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {formatScore20(report.scoreOn20)} <span className="text-lg font-medium text-slate-400">/ 20</span>
                </div>
                <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5">
                  {report.correctCount} / {report.totalQuestions} bonnes réponses
                </div>
              </div>

              <div className="h-12 w-px bg-slate-200 dark:bg-slate-800" />

              <div className="text-right">
                <div className="text-xs text-slate-500 dark:text-slate-400">Gain XP</div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  +{report.xpAwarded}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {report.persisted ? 'Enregistré en base' : 'Mode exploration'}
                </div>
              </div>
            </div>
          </div>

          {report.newlyUnlockedBadges.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5 text-sm text-emerald-700 dark:text-emerald-300">
              <Medal className="w-4 h-4 shrink-0" />
              <span>
                Nouveau badge débloqué :{' '}
                <strong>{report.newlyUnlockedBadges.map((b) => b.title).join(', ')}</strong>
              </span>
            </div>
          )}

          {!profile && (
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
              <span>
                Connectez-vous avec Google pour enregistrer vos prochaines copies dans votre relevé officiel et cumuler vos XP.
              </span>
              <button
                type="button"
                onClick={onSignIn}
                className="font-semibold text-slate-900 dark:text-white underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Connexion Google
              </button>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
            {presetForRetry && (
              <button
                type="button"
                onClick={() => handleStartExam(presetForRetry)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${ACCENT_BTN_MAP[accentColor]}`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Nouveau sujet ({presetForRetry.shortLabel})
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setPhase('catalog');
                setReport(null);
              }}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap cursor-pointer"
            >
              Choisir un autre examen
            </button>
          </div>
        </section>

        {/* Bulletin par matière */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Résultats détaillés par matière
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.subjectBreakdown.map((item) => {
              const pct = Math.round((item.correct / Math.max(1, item.total)) * 100);
              const status = subjectStatusLabel(item.scoreOn20);
              return (
                <div
                  key={item.subject}
                  className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {item.label}
                    </span>
                    <span className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                      {formatScore20(item.scoreOn20)} / 20
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-slate-900 dark:bg-white transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${status.className}`}>{status.label}</span>
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {item.correct} / {item.total}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Correction question par question */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Correction complète de la copie
              </h3>
            </div>

            <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setCorrectionFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  correctionFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Toutes ({report.corrections.length})
              </button>
              <button
                type="button"
                onClick={() => setCorrectionFilter('errors')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  correctionFilter === 'errors'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Erreurs uniquement ({errorCount})
              </button>
            </div>
          </div>

          {filteredCorrections.length === 0 ? (
            <p className="text-sm text-emerald-700 dark:text-emerald-300 py-4">
              Aucune erreur sur cette copie — félicitations pour ce sans-faute !
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCorrections.map((item, idx) => (
                <div key={item.questionId} className="py-4 first:pt-1 last:pb-0 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                        #{idx + 1}
                      </span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span>{item.subjectLabel}</span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span>{item.chapterTitle}</span>
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        item.isCorrect
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}
                    >
                      {item.isCorrect ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" /> {item.wasAnswered ? 'Incorrect' : 'Non répondu'}
                        </>
                      )}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {item.prompt}
                  </p>

                  <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap gap-x-6 gap-y-1">
                    <span>
                      Votre réponse :{' '}
                      <strong className="font-mono text-slate-900 dark:text-white">
                        {item.submittedAnswer}
                      </strong>
                    </span>
                    {!item.isCorrect && (
                      <span>
                        Réponse attendue :{' '}
                        <strong className="font-mono text-emerald-700 dark:text-emerald-300">
                          {item.correctAnswer}
                        </strong>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  return null;
};
