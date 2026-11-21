import {
  evaluateDynamicQuestionAnswer,
  generateDynamicQuiz,
  type GeneratedQuizQuestion,
  type PublicQuizQuestion,
  type QuizDifficulty,
  type SeedChapterExerciseRef,
} from './dynamicQuizEngine.ts';
import type { ChapterItem, GradeLevel, SubjectId } from '../types/learning.ts';

export type ExamMention =
  | 'Très Bien'
  | 'Bien'
  | 'Assez Bien'
  | 'Admis'
  | 'À consolider';

export interface MockExamPreset {
  slug: string;
  title: string;
  shortLabel: string;
  cycleLabel: string;
  gradeLevels: GradeLevel[];
  selectableGrades?: GradeLevel[];
  subjects: SubjectId[];
  questionCount: number;
  timeLimitSec: number;
  difficulty: QuizDifficulty;
  description: string;
}

export interface GeneratedExamQuestion extends GeneratedQuizQuestion {
  subject: SubjectId;
  subjectLabel: string;
}

export interface PublicExamQuestion extends PublicQuizQuestion {
  subject: SubjectId;
  subjectLabel: string;
}

export interface ExamSubjectBreakdown {
  subject: SubjectId;
  label: string;
  correct: number;
  total: number;
  scoreOn20: number;
}

export interface ExamCorrectionItem {
  questionId: string;
  chapterTitle: string;
  gradeLevel: string;
  subject: SubjectId;
  subjectLabel: string;
  prompt: string;
  submittedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  wasAnswered: boolean;
  explanation: string;
}

export interface GradedExamReport {
  examSlug: string;
  examTitle: string;
  gradeLabel: string;
  scoreOn20: number;
  correctCount: number;
  totalQuestions: number;
  mention: ExamMention;
  durationSeconds: number;
  xpAwarded: number;
  subjectBreakdown: ExamSubjectBreakdown[];
  corrections: ExamCorrectionItem[];
}

export interface ExamHistoryEntry {
  id: number;
  examSlug: string;
  examTitle: string;
  gradeLabel: string;
  scoreOn20: number;
  correctCount: number;
  totalQuestions: number;
  mention: ExamMention;
  durationSeconds: number;
  xpAwarded: number;
  subjectBreakdown: ExamSubjectBreakdown[];
  createdAt: string;
}

export const SUBJECT_DISPLAY_LABELS: Record<SubjectId, string> = {
  mathematics: 'Mathématiques',
  physics_chemistry: 'Physique-Chimie',
  svt: 'SVT',
  history_geography: 'Histoire-Géographie',
  french_philosophy: 'Français & Philo',
  english_lv1: 'Anglais LV1',
};

export const MOCK_EXAM_PRESETS: MockExamPreset[] = [
  {
    slug: 'dnb-brevet-3e',
    title: 'Diplôme National du Brevet (DNB)',
    shortLabel: 'Brevet 3ᵉ',
    cycleLabel: '3ᵉ · Collège',
    gradeLevels: ['3e'],
    subjects: ['french_philosophy', 'mathematics', 'history_geography', 'physics_chemistry', 'svt'],
    questionCount: 12,
    timeLimitSec: 15 * 60,
    difficulty: 'standard',
    description:
      'Épreuve blanche pluridisciplinaire conforme aux quatre pôles écrits du Brevet : Français, Mathématiques, Histoire-Géo et Sciences.',
  },
  {
    slug: 'bac-tronc-commun',
    title: 'Baccalauréat Général — Tronc Commun',
    shortLabel: 'Bac Général',
    cycleLabel: '1ʳᵉ & Terminale · Lycée',
    gradeLevels: ['1ere', 'terminale'],
    subjects: [
      'french_philosophy',
      'history_geography',
      'english_lv1',
      'mathematics',
      'physics_chemistry',
      'svt',
    ],
    questionCount: 12,
    timeLimitSec: 18 * 60,
    difficulty: 'defi',
    description:
      'Synthèse chronométrée sur les enseignements communs du cycle terminal : Philosophie & Lettres, Histoire-Géo, Anglais LV1 et culture scientifique.',
  },
  {
    slug: 'bac-sciences',
    title: 'Bac Spécialités Scientifiques',
    shortLabel: 'Bac Sciences',
    cycleLabel: 'Terminale · Lycée',
    gradeLevels: ['terminale'],
    subjects: ['mathematics', 'physics_chemistry', 'svt'],
    questionCount: 12,
    timeLimitSec: 18 * 60,
    difficulty: 'defi',
    description:
      'Épreuve intensive dédiée au trio scientifique de Terminale : analyse et probabilités, mécanique et chimie, génétique et climat.',
  },
  {
    slug: 'bac-humanites',
    title: 'Bac Lettres, Philosophie & Langues',
    shortLabel: 'Bac Humanités',
    cycleLabel: '1ʳᵉ & Terminale · Lycée',
    gradeLevels: ['1ere', 'terminale'],
    subjects: ['french_philosophy', 'history_geography', 'english_lv1'],
    questionCount: 12,
    timeLimitSec: 16 * 60,
    difficulty: 'defi',
    description:
      'Entraînement ciblé sur les épreuves littéraires et géopolitiques : dissertation philosophique, histoire contemporaine et maîtrise B2 en anglais.',
  },
  {
    slug: 'bilan-seconde',
    title: 'Bilan Général de Seconde',
    shortLabel: 'Bilan 2nde',
    cycleLabel: '2nde · Lycée',
    gradeLevels: ['2nde'],
    subjects: [
      'mathematics',
      'physics_chemistry',
      'svt',
      'history_geography',
      'french_philosophy',
      'english_lv1',
    ],
    questionCount: 12,
    timeLimitSec: 15 * 60,
    difficulty: 'standard',
    description:
      'Évaluation complète des 6 matières de Seconde pour valider les bases avant le choix des spécialités de Première.',
  },
  {
    slug: 'bilan-college',
    title: 'Contrôle Bilan Collège',
    shortLabel: 'Bilan Collège',
    cycleLabel: '6ᵉ, 5ᵉ ou 4ᵉ · Collège',
    gradeLevels: ['6e', '5e', '4e'],
    selectableGrades: ['6e', '5e', '4e'],
    subjects: [
      'mathematics',
      'french_philosophy',
      'english_lv1',
      'history_geography',
      'physics_chemistry',
      'svt',
    ],
    questionCount: 12,
    timeLimitSec: 14 * 60,
    difficulty: 'standard',
    description:
      'Devoir commun multi-matières adapté à la classe choisie (6ᵉ, 5ᵉ ou 4ᵉ) pour mesurer sa régularité sur tout le programme.',
  },
];

export function getExamPresetBySlug(slug: string): MockExamPreset | undefined {
  return MOCK_EXAM_PRESETS.find((p) => p.slug === slug);
}

export function computeFrenchMention(scoreOn20: number): ExamMention {
  if (scoreOn20 >= 16) return 'Très Bien';
  if (scoreOn20 >= 14) return 'Bien';
  if (scoreOn20 >= 12) return 'Assez Bien';
  if (scoreOn20 >= 10) return 'Admis';
  return 'À consolider';
}

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function resolveExamGradeLabel(
  preset: MockExamPreset,
  requestedGrade?: GradeLevel
): { targetGrades: GradeLevel[]; gradeLabel: string } {
  if (
    preset.selectableGrades &&
    requestedGrade &&
    preset.selectableGrades.includes(requestedGrade)
  ) {
    const labelMap: Record<GradeLevel, string> = {
      '6e': '6ᵉ · Collège',
      '5e': '5ᵉ · Collège',
      '4e': '4ᵉ · Collège',
      '3e': '3ᵉ · Collège',
      '2nde': '2nde · Lycée',
      '1ere': '1ʳᵉ · Lycée',
      terminale: 'Terminale · Lycée',
    };
    return { targetGrades: [requestedGrade], gradeLabel: labelMap[requestedGrade] };
  }
  if (preset.selectableGrades && preset.selectableGrades.length > 0) {
    const fallback = preset.selectableGrades[0];
    return { targetGrades: [fallback], gradeLabel: `${fallback} · Collège` };
  }
  return { targetGrades: preset.gradeLevels, gradeLabel: preset.cycleLabel };
}

export function buildMockExamQuestions(params: {
  preset: MockExamPreset;
  allChapters: ChapterItem[];
  exercisesMap: Map<number, SeedChapterExerciseRef[]>;
  requestedGrade?: GradeLevel;
}): {
  questions: GeneratedExamQuestion[];
  gradeLabel: string;
} {
  const { preset, allChapters, exercisesMap, requestedGrade } = params;
  const { targetGrades, gradeLabel } = resolveExamGradeLabel(preset, requestedGrade);
  const gradeSet = new Set<GradeLevel>(targetGrades);

  const chapterById = new Map<number, ChapterItem>();
  for (const ch of allChapters) {
    chapterById.set(ch.id, ch);
  }

  // Répartir équitablement le nombre de questions par matière de l'épreuve
  const subjects = preset.subjects;
  const basePerSubject = Math.floor(preset.questionCount / subjects.length);
  const remainder = preset.questionCount % subjects.length;

  const collected: GeneratedExamQuestion[] = [];
  const usedPrompts = new Set<string>();
  let globalIdx = 0;

  subjects.forEach((subject, subjectIdx) => {
    const targetForSubject = basePerSubject + (subjectIdx < remainder ? 1 : 0);
    if (targetForSubject <= 0) return;

    const matchingChapters = shuffleArray(
      allChapters.filter(
        (c) => (c.subject || 'mathematics') === subject && gradeSet.has(c.gradeLevel)
      )
    );
    if (matchingChapters.length === 0) return;

    // Génère au moins 3 questions (minimum interne de generateDynamicQuiz) puis prélève le quota exact
    const pool = generateDynamicQuiz(matchingChapters, allChapters, exercisesMap, {
      questionCount: Math.max(3, targetForSubject + 2),
      difficulty: preset.difficulty,
      mode: 'mixte',
    });

    let taken = 0;
    for (const q of pool) {
      if (taken >= targetForSubject) break;
      if (usedPrompts.has(q.prompt)) continue;
      usedPrompts.add(q.prompt);

      const ch = chapterById.get(q.chapterId);
      const qSubject: SubjectId = (ch?.subject as SubjectId) || subject;
      collected.push({
        ...q,
        id: `exam-q-${++globalIdx}`,
        subject: qSubject,
        subjectLabel: SUBJECT_DISPLAY_LABELS[qSubject] || qSubject,
      });
      taken += 1;
    }
  });

  // Complément éventuel si une matière manquait de questions uniques
  if (collected.length < preset.questionCount) {
    const fallbackPoolChapters = shuffleArray(
      allChapters.filter(
        (c) =>
          subjects.includes((c.subject || 'mathematics') as SubjectId) &&
          gradeSet.has(c.gradeLevel)
      )
    );
    if (fallbackPoolChapters.length > 0) {
      const extra = generateDynamicQuiz(fallbackPoolChapters, allChapters, exercisesMap, {
        questionCount: Math.max(3, preset.questionCount - collected.length + 3),
        difficulty: preset.difficulty,
        mode: 'mixte',
      });
      for (const q of extra) {
        if (collected.length >= preset.questionCount) break;
        if (usedPrompts.has(q.prompt)) continue;
        usedPrompts.add(q.prompt);
        const ch = chapterById.get(q.chapterId);
        const qSubject: SubjectId = (ch?.subject as SubjectId) || 'mathematics';
        collected.push({
          ...q,
          id: `exam-q-${++globalIdx}`,
          subject: qSubject,
          subjectLabel: SUBJECT_DISPLAY_LABELS[qSubject] || qSubject,
        });
      }
    }
  }

  return {
    questions: collected,
    gradeLabel,
  };
}

export function sanitizeExamQuestions(questions: GeneratedExamQuestion[]): PublicExamQuestion[] {
  return questions.map((q) => ({
    id: q.id,
    chapterId: q.chapterId,
    chapterSlug: q.chapterSlug,
    chapterTitle: q.chapterTitle,
    gradeLevel: q.gradeLevel,
    exerciseType: q.exerciseType,
    origin: q.origin,
    prompt: q.prompt,
    hint: q.hint,
    options: q.options,
    baseXp: q.baseXp,
    subject: q.subject,
    subjectLabel: q.subjectLabel,
  }));
}

export function gradeMockExam(params: {
  preset: MockExamPreset;
  gradeLabel: string;
  questions: GeneratedExamQuestion[];
  answers: Record<string, string>;
  durationSeconds: number;
}): GradedExamReport {
  const { preset, gradeLabel, questions, answers, durationSeconds } = params;
  const totalQuestions = Math.max(1, questions.length);

  let correctCount = 0;
  const perSubject = new Map<
    SubjectId,
    { label: string; correct: number; total: number }
  >();

  const corrections: ExamCorrectionItem[] = [];

  for (const q of questions) {
    const rawSubmitted = typeof answers[q.id] === 'string' ? answers[q.id].trim() : '';
    const wasAnswered = rawSubmitted.length > 0;

    let isCorrect = false;
    if (wasAnswered) {
      const ev = evaluateDynamicQuestionAnswer({
        question: q,
        submittedAnswer: rawSubmitted,
        responseTimeMs: 15000,
        currentStreak: 0,
        isFinalQuestion: false,
        totalCorrectSoFar: correctCount,
        totalQuestions,
      });
      isCorrect = ev.isCorrect;
    }

    if (isCorrect) correctCount += 1;

    const bucket = perSubject.get(q.subject) || {
      label: q.subjectLabel,
      correct: 0,
      total: 0,
    };
    bucket.total += 1;
    if (isCorrect) bucket.correct += 1;
    perSubject.set(q.subject, bucket);

    corrections.push({
      questionId: q.id,
      chapterTitle: q.chapterTitle,
      gradeLevel: q.gradeLevel,
      subject: q.subject,
      subjectLabel: q.subjectLabel,
      prompt: q.prompt,
      submittedAnswer: wasAnswered ? rawSubmitted : 'Non répondu',
      correctAnswer: q.correctAnswer,
      isCorrect,
      wasAnswered,
      explanation: q.explanation,
    });
  }

  const scoreOn20 = Math.round((correctCount / totalQuestions) * 200) / 10;
  const mention = computeFrenchMention(scoreOn20);

  const subjectBreakdown: ExamSubjectBreakdown[] = Array.from(perSubject.entries()).map(
    ([subject, stats]) => ({
      subject,
      label: stats.label,
      correct: stats.correct,
      total: stats.total,
      scoreOn20: Math.round((stats.correct / Math.max(1, stats.total)) * 200) / 10,
    })
  );

  // Calcul XP d'examen blanc : nécessite au moins 1 bonne réponse (anti-farm sur copies blanches)
  let xpAwarded = 0;
  if (correctCount > 0) {
    const mentionBonus =
      mention === 'Très Bien'
        ? 90
        : mention === 'Bien'
          ? 60
          : mention === 'Assez Bien'
            ? 35
            : mention === 'Admis'
              ? 20
              : 0;
    const difficultyFactor = preset.difficulty === 'defi' ? 1.15 : 1;
    const rawXp = Math.round((20 + correctCount * 14 + mentionBonus) * difficultyFactor);
    xpAwarded = Math.max(15, Math.min(300, rawXp));
  }

  return {
    examSlug: preset.slug,
    examTitle: preset.title,
    gradeLabel,
    scoreOn20,
    correctCount,
    totalQuestions: questions.length,
    mention,
    durationSeconds: Math.max(1, Math.round(durationSeconds)),
    xpAwarded,
    subjectBreakdown,
    corrections,
  };
}
