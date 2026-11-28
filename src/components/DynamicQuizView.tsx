import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Atom,
  Award,
  Calculator,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Dna,
  Feather,
  Flame,
  HelpCircle,
  Landmark,
  Languages,
  RefreshCw,
  Send,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import { ALL_SEED_CHAPTERS, GRADE_LEVELS, SUBJECTS } from '../db/curriculumData.ts';
import {
  evaluateDynamicQuestionAnswer,
  generateDynamicQuiz,
  sanitizeQuizQuestions,
  type GeneratedQuizQuestion,
  type PublicQuizQuestion,
  type QuizDifficulty,
  type QuizMode,
  type SeedChapterExerciseRef,
  type XpBreakdown,
} from '../services/dynamicQuizEngine.ts';
import type {
  AccentColor,
  BadgeItem,
  ChapterItem,
  GradeLevel,
  MistakeItem,
  SubjectId,
  UserProfile,
} from '../types/learning.ts';
import type { PrintableDocument } from '../utils/printExport.tsx';
import { MockExamView } from './MockExamView.tsx';
import { GrandOralView } from './GrandOralView.tsx';

interface DynamicQuizViewProps {
  chapters: ChapterItem[];
  initialChapterIds?: number[];
  initialWorkspaceMode?: 'quiz' | 'exam' | 'grand_oral';
  profile: UserProfile | null;
  accentColor: AccentColor;
  backendAvailable: boolean;
  onSignIn: () => Promise<boolean>;
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onXpSynced: (newTotalXp: number, newBadges: BadgeItem[]) => void;
  onPrintDocument?: (doc: PrintableDocument) => void;
  onMistakeRecorded?: (mistake: MistakeItem) => void;
}

interface QuestionResultRecord {
  question: PublicQuizQuestion;
  submittedAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  xpBreakdown: XpBreakdown;
  responseTimeMs: number;
  persisted: boolean;
  newBadges: BadgeItem[];
}

const ACCENT_BTN_MAP: Record<AccentColor, string> = {
  indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  amber: 'bg-amber-600 hover:bg-amber-700 text-white',
  sky: 'bg-sky-600 hover:bg-sky-700 text-white',
};

const DIFFICULTY_META: Array<{
  id: QuizDifficulty;
  label: string;
  baseXp: number;
  desc: string;
}> = [
  { id: 'decouverte', label: 'Découverte', baseXp: 25, desc: '25 XP / bonne réponse' },
  { id: 'standard', label: 'Standard', baseXp: 40, desc: '40 XP / bonne réponse' },
  { id: 'defi', label: 'Défi', baseXp: 60, desc: '60 XP / bonne réponse' },
];

const MODE_META: Array<{ id: QuizMode; label: string }> = [
  { id: 'mixte', label: 'Mixte (QCM + Calculs)' },
  { id: 'qcm', label: 'QCM uniquement' },
  { id: 'numerique', label: 'Calculs numériques' },
];

const ORIGIN_LABELS: Record<PublicQuizQuestion['origin'], string> = {
  parametric: 'Données générées dynamiquement',
  formula_synthesis: 'Synthèse de formule',
  chapter_exercise: 'Exercice du chapitre',
};

export const DynamicQuizView: React.FC<DynamicQuizViewProps> = ({
  chapters,
  initialChapterIds,
  initialWorkspaceMode = 'quiz',
  profile,
  accentColor,
  backendAvailable,
  onSignIn,
  apiFetch,
  onXpSynced,
  onPrintDocument,
  onMistakeRecorded,
}) => {
  const [workspaceMode, setWorkspaceMode] = useState<'quiz' | 'exam' | 'grand_oral'>(
    initialWorkspaceMode
  );
  const [filterSubject, setFilterSubject] = useState<'all' | SubjectId>('all');
  const [filterGrade, setFilterGrade] = useState<'all' | GradeLevel>('all');
  const [selectedIds, setSelectedIds] = useState<number[]>(() =>
    initialChapterIds && initialChapterIds.length > 0 ? initialChapterIds : []
  );

  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('standard');
  const [mode, setMode] = useState<QuizMode>('mixte');

  // Session state
  const [phase, setPhase] = useState<'setup' | 'active' | 'summary'>('setup');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<PublicQuizQuestion[]>([]);
  const [localAnswerKey, setLocalAnswerKey] = useState<GeneratedQuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answerInput, setAnswerInput] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [loadingGen, setLoadingGen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [currentResult, setCurrentResult] = useState<QuestionResultRecord | null>(null);
  const [history, setHistory] = useState<QuestionResultRecord[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [sessionXp, setSessionXp] = useState<number>(0);
  const [elapsedSec, setElapsedSec] = useState<number>(0);

  const questionStartRef = useRef<number>(performance.now());
  const hasInitializedSelectionRef = useRef<boolean>(
    Boolean(initialChapterIds && initialChapterIds.length > 0)
  );

  useEffect(() => {
    setWorkspaceMode(initialWorkspaceMode);
  }, [initialWorkspaceMode]);

  // Synchronise la pré-sélection si l'élève arrive depuis un chapitre précis
  useEffect(() => {
    if (initialChapterIds && initialChapterIds.length > 0) {
      hasInitializedSelectionRef.current = true;
      setWorkspaceMode('quiz');
      setSelectedIds(initialChapterIds);
      const firstChap = chapters.find((c) => c.id === initialChapterIds[0]);
      if (firstChap) {
        setFilterSubject(firstChap.subject || 'mathematics');
        setFilterGrade(firstChap.gradeLevel);
      }
      setPhase('setup');
    }
  }, [initialChapterIds, chapters]);

  // Sélection par défaut unique au premier chargement (permet ensuite au bouton Effacer de vider la sélection)
  useEffect(() => {
    if (hasInitializedSelectionRef.current || chapters.length === 0) return;
    hasInitializedSelectionRef.current = true;
    const targetGrade = profile?.gradeLevel || '6e';
    const matching = chapters.filter((c) => c.gradeLevel === targetGrade).slice(0, 3);
    if (matching.length > 0) {
      setSelectedIds(matching.map((c) => c.id));
    } else {
      setSelectedIds([chapters[0].id]);
    }
  }, [chapters, profile?.gradeLevel]);

  // Chronomètre léger sur la question en cours
  useEffect(() => {
    if (phase !== 'active' || currentResult) return;
    setElapsedSec(0);
    const id = window.setInterval(() => {
      setElapsedSec(Math.floor((performance.now() - questionStartRef.current) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, [phase, currentIdx, currentResult]);

  const filteredChapters = useMemo(() => {
    return chapters.filter((ch) => {
      const subjOk =
        filterSubject === 'all' || (ch.subject || 'mathematics') === filterSubject;
      const gradeOk = filterGrade === 'all' || ch.gradeLevel === filterGrade;
      return subjOk && gradeOk;
    });
  }, [chapters, filterSubject, filterGrade]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedChapters = useMemo(
    () => chapters.filter((c) => selectedSet.has(c.id)),
    [chapters, selectedSet]
  );

  const toggleChapter = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllVisible = () => {
    setSelectedIds((prev) => {
      const merged = new Set(prev);
      for (const ch of filteredChapters) merged.add(ch.id);
      return Array.from(merged);
    });
  };

  const clearSelection = () => setSelectedIds([]);

  const estimatedMaxXp = useMemo(() => {
    const base = DIFFICULTY_META.find((d) => d.id === difficulty)?.baseXp ?? 40;
    let total = 0;
    for (let i = 0; i < questionCount; i++) {
      const streakBonus = i >= 1 ? Math.min(i, 5) * 10 : 0;
      total += base + streakBonus + 10; // inclut bonus rapidité
    }
    return total + 100; // bonus sans-faute
  }, [difficulty, questionCount]);

  const handleGenerateQuiz = async () => {
    if (selectedIds.length === 0) {
      setErrorMsg('Sélectionnez au moins un chapitre pour générer votre quiz.');
      return;
    }

    setLoadingGen(true);
    setErrorMsg(null);
    setHistory([]);
    setCurrentResult(null);
    setStreak(0);
    setBestStreak(0);
    setSessionXp(0);
    setCurrentIdx(0);
    setAnswerInput('');
    setShowHint(false);

    try {
      if (backendAvailable) {
        const res = await apiFetch('/api/quiz/generate', {
          method: 'POST',
          body: JSON.stringify({
            chapterIds: selectedIds,
            questionCount,
            difficulty,
            mode,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Impossible de générer le quiz.');
        }
        setSessionId(data.sessionId);
        setQuestions(data.questions || []);
        setLocalAnswerKey([]);
      } else {
        // Mode autonome local (hébergement statique)
        const exMap = new Map<number, SeedChapterExerciseRef[]>();
        for (const ch of selectedChapters) {
          const seed = ALL_SEED_CHAPTERS.find((s) => s.slug === ch.slug);
          if (seed) {
            exMap.set(
              ch.id,
              seed.exercises.map((ex) => ({
                chapterId: ch.id,
                ...ex,
              }))
            );
          }
        }
        const generated = generateDynamicQuiz(selectedChapters, chapters, exMap, {
          questionCount,
          difficulty,
          mode,
        });
        setSessionId('local-session');
        setLocalAnswerKey(generated);
        setQuestions(sanitizeQuizQuestions(generated));
      }

      questionStartRef.current = performance.now();
      setPhase('active');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur lors de la génération.');
    } finally {
      setLoadingGen(false);
    }
  };

  const activeQuestion = questions[currentIdx] || null;

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuestion || !answerInput.trim() || submitting || currentResult) return;

    setSubmitting(true);
    setErrorMsg(null);
    const responseTimeMs = Math.max(500, Math.round(performance.now() - questionStartRef.current));

    try {
      if (backendAvailable && sessionId && sessionId !== 'local-session') {
        const res = await apiFetch('/api/quiz/answer', {
          method: 'POST',
          body: JSON.stringify({
            sessionId,
            questionId: activeQuestion.id,
            submittedAnswer: answerInput.trim(),
            responseTimeMs,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Validation impossible.');
        }

        const record: QuestionResultRecord = {
          question: activeQuestion,
          submittedAnswer: answerInput.trim(),
          isCorrect: data.isCorrect,
          correctAnswer: data.correctAnswer,
          explanation: data.explanation,
          xpBreakdown: data.xpBreakdown,
          responseTimeMs,
          persisted: Boolean(data.persisted),
          newBadges: data.newlyUnlockedBadges || [],
        };

        setCurrentResult(record);
        setHistory((prev) => [...prev, record]);
        setStreak(data.currentStreak ?? 0);
        setBestStreak((b) => Math.max(b, data.currentStreak ?? 0));
        setSessionXp((xp) => xp + (data.xpBreakdown?.totalXp ?? 0));

        if (!data.isCorrect && onMistakeRecorded) {
          onMistakeRecorded({
            key: `quiz-${activeQuestion.chapterId}-${activeQuestion.id}`,
            exerciseId: null,
            chapterId: activeQuestion.chapterId,
            chapterTitle: activeQuestion.chapterTitle,
            subject: activeQuestion.subject,
            gradeLevel: activeQuestion.gradeLevel as GradeLevel,
            exerciseType: activeQuestion.options ? 'quiz' : 'practice',
            prompt: activeQuestion.prompt,
            hint: activeQuestion.hint,
            options: activeQuestion.options,
            explanation: data.explanation || '',
            correctAnswer: data.correctAnswer,
            lastSubmittedAnswer: answerInput.trim(),
            wrongCount: 1,
            lastWrongAt: new Date().toISOString(),
            resolved: false,
            source: 'quiz',
          });
        }

        if (data.persisted && typeof data.userXp === 'number') {
          onXpSynced(data.userXp, data.newlyUnlockedBadges || []);
        }
      } else {
        // Évaluation locale
        const fullQ = localAnswerKey.find((q) => q.id === activeQuestion.id);
        if (!fullQ) throw new Error('Question introuvable.');
        const evalRes = evaluateDynamicQuestionAnswer({
          question: fullQ,
          submittedAnswer: answerInput.trim(),
          responseTimeMs,
          currentStreak: streak,
          isFinalQuestion: currentIdx + 1 >= questions.length,
          totalCorrectSoFar: history.filter((h) => h.isCorrect).length,
          totalQuestions: questions.length,
        });

        const record: QuestionResultRecord = {
          question: activeQuestion,
          submittedAnswer: answerInput.trim(),
          isCorrect: evalRes.isCorrect,
          correctAnswer: fullQ.correctAnswer,
          explanation: fullQ.explanation,
          xpBreakdown: evalRes.xpBreakdown,
          responseTimeMs,
          persisted: false,
          newBadges: [],
        };
        setCurrentResult(record);
        setHistory((prev) => [...prev, record]);
        setStreak(evalRes.nextStreak);
        setBestStreak((b) => Math.max(b, evalRes.nextStreak));
        setSessionXp((xp) => xp + evalRes.xpBreakdown.totalXp);

        if (!evalRes.isCorrect && onMistakeRecorded) {
          onMistakeRecorded({
            key: `quiz-${activeQuestion.chapterId}-${activeQuestion.id}`,
            exerciseId: null,
            chapterId: activeQuestion.chapterId,
            chapterTitle: activeQuestion.chapterTitle,
            subject: activeQuestion.subject,
            gradeLevel: activeQuestion.gradeLevel as GradeLevel,
            exerciseType: activeQuestion.options ? 'quiz' : 'practice',
            prompt: activeQuestion.prompt,
            hint: activeQuestion.hint,
            options: activeQuestion.options,
            explanation: fullQ.explanation,
            correctAnswer: fullQ.correctAnswer,
            lastSubmittedAnswer: answerInput.trim(),
            wrongCount: 1,
            lastWrongAt: new Date().toISOString(),
            resolved: false,
            source: 'quiz',
          });
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur réseau.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      setPhase('summary');
      return;
    }
    setCurrentIdx((i) => i + 1);
    setAnswerInput('');
    setShowHint(false);
    setCurrentResult(null);
    setErrorMsg(null);
    questionStartRef.current = performance.now();
  };

  const totalCorrect = history.filter((h) => h.isCorrect).length;
  const accuracyPct =
    history.length > 0 ? Math.round((totalCorrect / history.length) * 100) : 0;
  const avgSec =
    history.length > 0
      ? (
          history.reduce((sum, h) => sum + h.responseTimeMs, 0) /
          history.length /
          1000
        ).toFixed(1)
      : '0.0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* En-tête */}
      <div className="pb-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {workspaceMode === 'exam'
              ? 'Épreuves blanches chronométrées · Note sur 20, Mention officielle & bilan par matière'
              : workspaceMode === 'grand_oral'
                ? 'Lycée (1ʳᵉ & Terminale) · Simulateur 10 + 10 min, grille officielle /20 & spécialités NSI / SES'
                : 'Générateur paramétrique · Rétroaction immédiate & calcul automatique d’XP'}
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {workspaceMode === 'exam'
              ? 'Examens blancs (Brevet & Bac)'
              : workspaceMode === 'grand_oral'
                ? 'Grand Oral & Spécialités (NSI · SES)'
                : 'Quiz dynamiques sur mesure'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setWorkspaceMode('quiz')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                workspaceMode === 'quiz'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Quiz sur mesure
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceMode('exam')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                workspaceMode === 'exam'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Examens blancs
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceMode('grand_oral')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                workspaceMode === 'grand_oral'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Grand Oral & Spécialités
            </button>
          </div>

          {workspaceMode === 'quiz' && phase !== 'setup' && (
            <button
              type="button"
              onClick={() => setPhase('setup')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Modifier les chapitres</span>
            </button>
          )}
        </div>
      </div>

      {workspaceMode === 'exam' ? (
        <MockExamView
          chapters={chapters}
          profile={profile}
          accentColor={accentColor}
          backendAvailable={backendAvailable}
          onSignIn={onSignIn}
          apiFetch={apiFetch}
          onXpSynced={onXpSynced}
        />
      ) : workspaceMode === 'grand_oral' ? (
        <GrandOralView
          accentColor={accentColor}
          onPrintDocument={(doc) => onPrintDocument?.(doc)}
        />
      ) : (
        <>
          {/* ==================== PHASE 1 : CONFIGURATION ==================== */}
          {phase === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Colonne gauche : sélection multi-chapitres */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {selectedIds.length > 1
                      ? `1. Sélectionnez vos chapitres sources (${selectedIds.length} sélectionnés)`
                      : `1. Sélectionnez vos chapitres sources (${selectedIds.length} sélectionné)`}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Les questions, valeurs numériques et formules sont générées dynamiquement à partir des chapitres cochés.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={selectAllVisible}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Tout cocher
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    Effacer
                  </button>
                </div>
              </div>

              {/* Filtres matière + niveau */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setFilterSubject('all')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      filterSubject === 'all'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Toutes
                  </button>
                  {SUBJECTS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFilterSubject(s.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        filterSubject === s.id
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {s.id === 'physics_chemistry' ? (
                        <Atom className="w-3 h-3" />
                      ) : s.id === 'svt' ? (
                        <Dna className="w-3 h-3" />
                      ) : s.id === 'history_geography' ? (
                        <Landmark className="w-3 h-3" />
                      ) : s.id === 'french_philosophy' ? (
                        <Feather className="w-3 h-3" />
                      ) : s.id === 'english_lv1' ? (
                        <Languages className="w-3 h-3" />
                      ) : (
                        <Calculator className="w-3 h-3" />
                      )}
                      <span>{s.shortLabel}</span>
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setFilterGrade('all')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      filterGrade === 'all'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Tous niveaux
                  </button>
                  {GRADE_LEVELS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setFilterGrade(g.id)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        filterGrade === g.id
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grille de chapitres cochables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                {filteredChapters.map((ch) => {
                  const checked = selectedSet.has(ch.id);
                  const subjectLabel =
                    ch.subject === 'physics_chemistry'
                      ? 'Physique-Chimie'
                      : ch.subject === 'svt'
                        ? 'SVT'
                        : ch.subject === 'history_geography'
                          ? 'Histoire-Géo'
                          : ch.subject === 'french_philosophy'
                            ? 'Français & Philo'
                            : ch.subject === 'english_lv1'
                              ? 'Anglais LV1'
                              : 'Mathématiques';
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleChapter(ch.id)}
                      className={`text-left p-3.5 rounded-xl border transition-colors cursor-pointer flex items-start gap-3 ${
                        checked
                          ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30 dark:border-indigo-500'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span
                        className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                          checked
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                          <span>
                            {subjectLabel} · {ch.gradeLevel}
                          </span>
                          <span className="font-mono tabular-nums">{ch.exercises.length} ex.</span>
                        </div>
                        <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
                          {ch.title}
                        </div>
                        <div className="mt-1 text-[11px] font-mono text-slate-600 dark:text-slate-400 truncate">
                          {ch.formulaDisplay}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Colonne droite : paramètres du quiz et lancement */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                2. Paramètres du quiz dynamique
              </h2>

              {/* Nombre de questions */}
              <div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                  Nombre de questions
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 8, 12].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={`py-2 text-xs font-mono font-semibold rounded-lg border transition-colors cursor-pointer ${
                        questionCount === cnt
                          ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {cnt} questions
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulté & XP */}
              <div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                  Niveau de difficulté & barème XP
                </div>
                <div className="space-y-2">
                  {DIFFICULTY_META.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDifficulty(d.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-lg border transition-colors flex items-center justify-between cursor-pointer ${
                        difficulty === d.id
                          ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30 text-slate-900 dark:text-white'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-xs font-semibold">{d.label}</span>
                      <span className="text-[11px] font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {d.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                  Format des questions
                </div>
                <div className="space-y-1.5">
                  {MODE_META.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id)}
                      className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                        mode === m.id
                          ? 'border-slate-900 dark:border-white bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Barème XP transparent */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                  <span>Potentiel maximum</span>
                  <span className="font-mono tabular-nums">jusqu’à +{estimatedMaxXp} XP</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Inclut les bonus automatiques de série (+10 XP/combo), de rapidité (+10 XP &lt; 15 s) et de complétion (+50 à +100 XP).
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                  {errorMsg}
                </div>
              )}

              <button
                type="button"
                disabled={loadingGen || selectedIds.length === 0}
                onClick={handleGenerateQuiz}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer ${ACCENT_BTN_MAP[accentColor]}`}
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {loadingGen ? 'Génération en cours...' : 'Générer le quiz dynamique'}
                </span>
              </button>

              {!profile && backendAvailable && (
                <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                  Connectez-vous avec Google pour créditer automatiquement les XP gagnés dans votre profil et le classement.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== PHASE 2 : SESSION ACTIVE ==================== */}
      {phase === 'active' && activeQuestion && (
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Barre d'état en direct */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                Question {currentIdx + 1} / {questions.length}
              </div>

              <div className="flex items-center gap-4 font-mono tabular-nums">
                <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <Clock className="w-3.5 h-3.5" />
                  {elapsedSec} s
                </span>
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                  <Flame className="w-3.5 h-3.5" />
                  Série ×{streak}
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                  <Trophy className="w-3.5 h-3.5" />
                  +{sessionXp} XP
                </span>
              </div>
            </div>

            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-300"
                style={{
                  width: `${Math.round(((currentIdx + (currentResult ? 1 : 0)) / questions.length) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Carte question */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span>
                {activeQuestion.subject === 'physics_chemistry'
                  ? 'Physique-Chimie'
                  : activeQuestion.subject === 'svt'
                    ? 'SVT'
                    : activeQuestion.subject === 'history_geography'
                      ? 'Histoire-Géo'
                      : activeQuestion.subject === 'french_philosophy'
                        ? 'Français & Philo'
                        : activeQuestion.subject === 'english_lv1'
                          ? 'Anglais LV1'
                          : 'Mathématiques'}{' '}
                · {activeQuestion.gradeLevel} ·{' '}
                <strong className="text-slate-700 dark:text-slate-200">
                  {activeQuestion.chapterTitle}
                </strong>
              </span>
              <span className="font-mono text-[11px]">
                {ORIGIN_LABELS[activeQuestion.origin]} · +{activeQuestion.baseXp} XP base
              </span>
            </div>

            <p className="text-base sm:text-lg font-semibold leading-relaxed text-slate-900 dark:text-white">
              {activeQuestion.prompt}
            </p>

            <form onSubmit={handleSubmitAnswer} className="space-y-4">
              {activeQuestion.options ? (
                <div className="grid grid-cols-1 gap-2.5">
                  {activeQuestion.options.map((opt) => {
                    const chosen = answerInput === opt;
                    const isRevealCorrect =
                      currentResult && opt === currentResult.correctAnswer;
                    const isRevealWrong =
                      currentResult && chosen && !currentResult.isCorrect;

                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={Boolean(currentResult)}
                        onClick={() => setAnswerInput(opt)}
                        className={`w-full text-left px-4 py-3 text-sm rounded-xl border transition-colors cursor-pointer disabled:cursor-default ${
                          isRevealCorrect
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 font-semibold'
                            : isRevealWrong
                              ? 'border-red-400 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200'
                              : chosen
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
                    disabled={Boolean(currentResult)}
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="Saisissez votre résultat numérique (ex: 12 ou 0.75)"
                    className="w-full px-4 py-3 text-base font-mono tabular-nums rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70"
                  />
                </div>
              )}

              {!currentResult && (
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
                    disabled={submitting || !answerInput.trim()}
                    className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer ${ACCENT_BTN_MAP[accentColor]}`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Vérification...' : 'Valider la réponse'}</span>
                  </button>
                </div>
              )}

              {showHint && !currentResult && (
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                  Indice : {activeQuestion.hint}
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                  {errorMsg}
                </div>
              )}
            </form>

            {/* Rétroaction immédiate & décomposition automatique d'XP */}
            {currentResult && (
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  currentResult.isCorrect
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50/80 dark:bg-amber-950/35 border-amber-200 dark:border-amber-800'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                    {currentResult.isCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Bonne réponse !</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>
                          Réponse attendue :{' '}
                          <span className="font-mono">{currentResult.correctAnswer}</span>
                        </span>
                      </>
                    )}
                  </div>

                  <div className="text-sm font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-300">
                    +{currentResult.xpBreakdown.totalXp} XP
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                  {currentResult.explanation}
                </p>

                {/* Détail du calcul automatique d'XP */}
                {currentResult.xpBreakdown.totalXp > 0 && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 border-t border-emerald-200/70 dark:border-emerald-800/70 text-[11px] font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    <span>Base : +{currentResult.xpBreakdown.baseXp} XP</span>
                    {currentResult.xpBreakdown.streakBonus > 0 && (
                      <span>Série : +{currentResult.xpBreakdown.streakBonus} XP</span>
                    )}
                    {currentResult.xpBreakdown.speedBonus > 0 && (
                      <span>Rapidité : +{currentResult.xpBreakdown.speedBonus} XP</span>
                    )}
                    {currentResult.xpBreakdown.completionBonus > 0 && (
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                        Bonus final : +{currentResult.xpBreakdown.completionBonus} XP
                      </span>
                    )}
                    {currentResult.persisted ? (
                      <span className="text-emerald-700 dark:text-emerald-400">
                        · Enregistré en base
                      </span>
                    ) : (
                      !profile &&
                      backendAvailable && (
                        <button
                          type="button"
                          onClick={() => void onSignIn()}
                          className="underline font-sans font-medium text-indigo-700 dark:text-indigo-300 cursor-pointer"
                        >
                          Connectez-vous pour sauvegarder vos XP
                        </button>
                      )
                    )}
                  </div>
                )}

                {currentResult.newBadges.length > 0 && (
                  <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                    <Award className="w-4 h-4 shrink-0" />
                    <span>
                      Nouveau badge débloqué :{' '}
                      {currentResult.newBadges.map((b) => b.title).join(', ')}
                    </span>
                  </div>
                )}

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${ACCENT_BTN_MAP[accentColor]}`}
                  >
                    <span>
                      {currentIdx + 1 >= questions.length
                        ? 'Voir le bilan final'
                        : 'Question suivante'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== PHASE 3 : BILAN FINAL ==================== */}
      {phase === 'summary' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="text-xs text-slate-500 dark:text-slate-400">Score obtenu</div>
              <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                {totalCorrect} / {history.length} ({accuracyPct}%)
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="text-xs text-slate-500 dark:text-slate-400">XP gagnés</div>
              <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                +{sessionXp} XP
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="text-xs text-slate-500 dark:text-slate-400">Meilleure série</div>
              <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                ×{bestStreak}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="text-xs text-slate-500 dark:text-slate-400">Temps moyen</div>
              <div className="mt-1 text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                {avgSec} s
              </div>
            </div>
          </div>

          {/* Récapitulatif détaillé question par question */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Correction détaillée de votre session
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateQuiz}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${ACCENT_BTN_MAP[accentColor]}`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Nouveau quiz (nouvelles valeurs)</span>
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {history.map((item, idx) => (
                <div key={item.question.id} className="p-4 space-y-1.5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      #{idx + 1} · {item.question.gradeLevel} · {item.question.chapterTitle}
                    </div>
                    <span
                      className={`text-xs font-mono tabular-nums font-semibold shrink-0 ${
                        item.isCorrect
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {item.isCorrect ? `+${item.xpBreakdown.totalXp} XP` : '0 XP'}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {item.question.prompt}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    Votre réponse : <span className="font-mono">{item.submittedAnswer}</span>
                    {!item.isCorrect && (
                      <>
                        {' '}
                        · Attendu : <span className="font-mono font-semibold">{item.correctAnswer}</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
