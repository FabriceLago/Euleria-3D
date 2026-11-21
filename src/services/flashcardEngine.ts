export type FlashcardRating = 'again' | 'hard' | 'good' | 'easy';

export interface FlashcardSm2State {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lastRating: FlashcardRating | null;
  nextReviewAt: string | null;
  lastReviewedAt: string | null;
  isDue: boolean;
  isMastered: boolean;
}

export interface ChapterFlashcardItem {
  cardKey: string;
  categoryLabel: string;
  front: string;
  back: string;
  hint: string | null;
  sm2: FlashcardSm2State;
}

export interface ChapterStudySheet {
  chapterTitle: string;
  gradeLevel: string;
  summary: string;
  formulaDisplay: string;
  keyPoints: string[];
  methodsAndTips: Array<{
    tip: string;
    detail: string;
  }>;
}

export interface ChapterExerciseSource {
  orderIndex: number;
  prompt: string;
  hint: string;
  correctAnswer: string;
  explanation: string;
}

export interface ChapterFlashcardSource {
  title: string;
  subtitle: string;
  gradeLevel: string;
  summary: string;
  theoryContent: string;
  formulaDisplay: string;
}

export function createDefaultSm2State(): FlashcardSm2State {
  return {
    easeFactor: 2.5,
    intervalDays: 0,
    repetitions: 0,
    lastRating: null,
    nextReviewAt: null,
    lastReviewedAt: null,
    isDue: true,
    isMastered: false,
  };
}

export function computeSm2NextState(
  prev: {
    easeFactor: number;
    intervalDays: number;
    repetitions: number;
  },
  rating: FlashcardRating,
  now: Date = new Date()
): {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lastRating: FlashcardRating;
  nextReviewAt: Date;
  lastReviewedAt: Date;
  isDue: boolean;
  isMastered: boolean;
} {
  const prevEf = Number.isFinite(prev.easeFactor) ? Math.max(1.3, Math.min(3.0, prev.easeFactor)) : 2.5;
  const prevInterval = Math.max(0, Math.round(prev.intervalDays || 0));
  const prevReps = Math.max(0, Math.round(prev.repetitions || 0));

  let easeFactor = prevEf;
  let intervalDays = prevInterval;
  let repetitions = prevReps;
  let nextReviewAt: Date;

  if (rating === 'again') {
    repetitions = 0;
    intervalDays = 0;
    easeFactor = Math.max(1.3, Number((prevEf - 0.2).toFixed(2)));
    nextReviewAt = new Date(now.getTime() + 10 * 60 * 1000);
  } else if (rating === 'hard') {
    repetitions = Math.max(1, prevReps);
    intervalDays = prevReps === 0 ? 1 : Math.max(1, Math.round(prevInterval * 1.2));
    easeFactor = Math.max(1.3, Number((prevEf - 0.15).toFixed(2)));
    nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  } else if (rating === 'good') {
    repetitions = prevReps + 1;
    if (prevReps === 0) {
      intervalDays = 1;
    } else if (prevReps === 1) {
      intervalDays = 3;
    } else {
      intervalDays = Math.max(3, Math.round(prevInterval * prevEf));
    }
    nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  } else {
    // easy
    repetitions = prevReps + 1;
    if (prevReps === 0) {
      intervalDays = 4;
    } else {
      intervalDays = Math.max(4, Math.round(Math.max(3, prevInterval) * prevEf * 1.3));
    }
    easeFactor = Math.min(3.0, Number((prevEf + 0.15).toFixed(2)));
    nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  }

  return {
    easeFactor,
    intervalDays,
    repetitions,
    lastRating: rating,
    nextReviewAt,
    lastReviewedAt: now,
    isDue: rating === 'again',
    isMastered: repetitions >= 1 && intervalDays >= 1,
  };
}

export function formatIntervalLabel(intervalDays: number): string {
  if (intervalDays <= 0) return '10 min';
  if (intervalDays === 1) return '1 j';
  if (intervalDays < 14) return `${intervalDays} j`;
  if (intervalDays < 60) return `${Math.round(intervalDays / 7)} sem.`;
  return `${Math.round(intervalDays / 30)} mois`;
}

export function splitTheoryIntoKeyPoints(theoryContent: string): string[] {
  const cleaned = theoryContent.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  const rawSentences = cleaned
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ0-9«(])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15);
  return rawSentences.length > 0 ? rawSentences.slice(0, 5) : [cleaned];
}

export function buildChapterStudySheet(
  chapter: ChapterFlashcardSource,
  exercises: ChapterExerciseSource[]
): ChapterStudySheet {
  const keyPoints = splitTheoryIntoKeyPoints(chapter.theoryContent);
  const methodsAndTips = exercises
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .slice(0, 3)
    .map((ex) => ({
      tip: ex.hint,
      detail: ex.explanation,
    }));

  return {
    chapterTitle: chapter.title,
    gradeLevel: chapter.gradeLevel,
    summary: chapter.summary,
    formulaDisplay: chapter.formulaDisplay,
    keyPoints,
    methodsAndTips,
  };
}

export function buildChapterFlashcards(
  chapter: ChapterFlashcardSource,
  exercises: ChapterExerciseSource[],
  reviewStateByCardKey?: Map<
    string,
    {
      easeFactor: number;
      intervalDays: number;
      repetitions: number;
      lastRating: string;
      nextReviewAt: Date;
      lastReviewedAt: Date;
    }
  >,
  now: Date = new Date()
): ChapterFlashcardItem[] {
  const resolveSm2 = (cardKey: string): FlashcardSm2State => {
    const row = reviewStateByCardKey?.get(cardKey);
    if (!row) return createDefaultSm2State();
    const rating: FlashcardRating =
      row.lastRating === 'again' ||
      row.lastRating === 'hard' ||
      row.lastRating === 'good' ||
      row.lastRating === 'easy'
        ? row.lastRating
        : 'good';
    return {
      easeFactor: row.easeFactor,
      intervalDays: row.intervalDays,
      repetitions: row.repetitions,
      lastRating: rating,
      nextReviewAt: row.nextReviewAt.toISOString(),
      lastReviewedAt: row.lastReviewedAt.toISOString(),
      isDue: row.nextReviewAt.getTime() <= now.getTime(),
      isMastered: row.repetitions >= 1 && row.intervalDays >= 1,
    };
  };

  const cards: ChapterFlashcardItem[] = [
    {
      cardKey: 'concept',
      categoryLabel: 'Notion clé',
      front: `Quel est le principe essentiel du chapitre « ${chapter.title} » (${chapter.gradeLevel}) ?`,
      back: `${chapter.summary} ${chapter.theoryContent}`,
      hint: chapter.subtitle,
      sm2: resolveSm2('concept'),
    },
    {
      cardKey: 'formula',
      categoryLabel: 'Formule & Règle',
      front: `Quelle est la formule, relation ou règle de référence à mémoriser pour « ${chapter.title} » ?`,
      back: `${chapter.formulaDisplay}\n\n${chapter.summary}`,
      hint: `Relisez le cadre « ${chapter.subtitle} ».`,
      sm2: resolveSm2('formula'),
    },
  ];

  const sortedEx = exercises.slice().sort((a, b) => a.orderIndex - b.orderIndex);
  sortedEx.forEach((ex, idx) => {
    const key = `ex-${ex.orderIndex || idx + 1}`;
    cards.push({
      cardKey: key,
      categoryLabel: `Application ${idx + 1}`,
      front: ex.prompt,
      back: `Réponse : ${ex.correctAnswer}\n\n${ex.explanation}`,
      hint: ex.hint,
      sm2: resolveSm2(key),
    });
  });

  return cards;
}

export function formatStudySheetAsText(sheet: ChapterStudySheet): string {
  const lines = [
    `FICHE DE RÉVISION — ${sheet.chapterTitle} (${sheet.gradeLevel})`,
    '',
    `L'ESSENTIEL : ${sheet.summary}`,
    `FORMULE / RÈGLE CLÉ : ${sheet.formulaDisplay}`,
    '',
    'POINTS CLÉS :',
    ...sheet.keyPoints.map((pt, i) => `${i + 1}. ${pt}`),
  ];

  if (sheet.methodsAndTips.length > 0) {
    lines.push('', 'MÉTHODES & RÉFLEXES :');
    sheet.methodsAndTips.forEach((m, i) => {
      lines.push(`${i + 1}. Astuce : ${m.tip}`);
      lines.push(`   Explication : ${m.detail}`);
    });
  }

  return lines.join('\n');
}
