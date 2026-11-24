export type GradeLevel = '6e' | '5e' | '4e' | '3e' | '2nde' | '1ere' | 'terminale';
export type SubjectId =
  | 'mathematics'
  | 'physics_chemistry'
  | 'svt'
  | 'history_geography'
  | 'french_philosophy'
  | 'english_lv1';
export type ThemeMode = 'light' | 'dark';
export type AccentColor = 'indigo' | 'emerald' | 'amber' | 'sky';
export type LayoutDensity = 'comfortable' | 'compact';

export interface ExerciseItem {
  id: number;
  chapterId: number;
  orderIndex: number;
  exerciseType: 'quiz' | 'practice';
  prompt: string;
  hint: string;
  options: string[] | null;
  xpValue: number;
}

export interface ChapterItem {
  id: number;
  slug: string;
  subject: SubjectId;
  gradeLevel: GradeLevel;
  orderIndex: number;
  title: string;
  subtitle: string;
  summary: string;
  theoryContent: string;
  formulaDisplay: string;
  scenePreset: string;
  defaultParams: Record<string, number>;
  xpReward: number;
  estimatedMinutes: number;
  exercises: ExerciseItem[];
}

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  gradeLevel: GradeLevel;
  xp: number;
  streakDays: number;
  themeMode: ThemeMode;
  accentColor: AccentColor;
  layoutDensity: LayoutDensity;
  show3DHints: boolean;
  weeklyXpGoal?: number;
  /** Classement public : désactivé par défaut */
  leaderboardOptIn?: boolean;
  pseudonym?: string | null;
}

export interface StudyPlanDailyActivity {
  dateIso: string;
  dayLabel: string;
  actionsCount: number;
  xpEarned: number;
}

export interface StudyPlanSubjectSummary {
  subject: SubjectId;
  label: string;
  gradeCompletedChapters: number;
  gradeTotalChapters: number;
  avgMasteryPct: number;
  avgExamScoreOn20: number | null;
  dueCardsCount: number;
  status: 'prioritaire' | 'en_cours' | 'solide' | 'a_decouvrir';
}

export interface StudyPlanPriorityChapter {
  chapterId: number;
  title: string;
  subject: SubjectId;
  subjectLabel: string;
  gradeLevel: GradeLevel;
  masteryPct: number;
  dueCardsCount: number;
  reason: string;
  priorityLevel: 'haute' | 'moyenne' | 'decouverte';
}

export interface StudyPlanDueChapter {
  chapterId: number;
  chapterTitle: string;
  subject: SubjectId;
  subjectLabel: string;
  gradeLevel: GradeLevel;
  dueCount: number;
}

export interface StudyPlanData {
  gradeLevel: GradeLevel;
  weeklyXpGoal: number;
  weeklyXpEarned: number;
  weeklyActionsCount: number;
  dailyActivity: StudyPlanDailyActivity[];
  dueFlashcardsCount: number;
  masteredFlashcardsCount: number;
  dueByChapter: StudyPlanDueChapter[];
  subjectSummaries: StudyPlanSubjectSummary[];
  priorityChapters: StudyPlanPriorityChapter[];
  latestExam: {
    examTitle: string;
    scoreOn20: number;
    mention: string;
    createdAt: string;
  } | null;
}

export interface ChapterProgress {
  id: number;
  userId: number;
  chapterId: number;
  completedExercisesCount: number;
  totalExercisesCount: number;
  masteryScore: number;
  predictedSuccessRate: number;
  status: 'not_started' | 'in_progress' | 'completed';
  lastPracticedAt: string;
  completedAt: string | null;
}

export interface BadgeItem {
  id: number;
  slug: string;
  title: string;
  description: string;
  iconName: string;
  xpThreshold: number;
  conditionType: string;
  earned: boolean;
  awardedAt: string | null;
}

export interface PredictionMetrics {
  masteryScore: number;
  predictedSuccessRate: number;
  fluencyFactor: number;
  learningVelocity: number;
  recommendedAction: string;
}

/** Entrée publique du classement : pseudonyme + XP + rang, rien qui identifie l'élève. */
export interface LeaderboardEntry {
  rank: number;
  pseudonym: string;
  xp: number;
}

export interface StudyRoom {
  id: number;
  slug: string;
  name: string;
  gradeLevel: string;
  topic: string;
}

export interface ChatMessageItem {
  id: number;
  roomId: number;
  roomSlug?: string;
  content: string;
  sharedChapterId: number | null;
  createdAt: string;
  authorId: number;
  authorName: string;
  authorGrade: string;
  authorAvatar: string | null;
  authorXp: number;
}

export interface MistakeItem {
  key: string;
  exerciseId: number | null;
  chapterId: number;
  chapterTitle: string;
  subject: SubjectId;
  gradeLevel: GradeLevel;
  exerciseType: 'quiz' | 'practice';
  prompt: string;
  hint: string;
  options: string[] | null;
  explanation: string;
  correctAnswer?: string;
  lastSubmittedAnswer: string;
  wrongCount: number;
  lastWrongAt: string;
  resolved: boolean;
  source: 'exercise' | 'quiz' | 'exam' | 'mission';
}

export interface MistakesNotebookData {
  unresolved: MistakeItem[];
  resolved: MistakeItem[];
  stats: {
    totalTracked: number;
    unresolvedCount: number;
    resolvedCount: number;
  };
}

export interface DuelLobbyItem {
  code: string;
  hostName: string;
  subject: SubjectId | 'all';
  gradeLevel: GradeLevel;
  status: 'waiting' | 'active' | 'finished';
  playerCount: number;
  maxPlayers: number;
  questionCount: number;
}

export interface DuelParticipantPublic {
  clientId: string;
  displayName: string;
  gradeLevel: string;
  score: number;
  correctCount: number;
  answeredCurrent: boolean;
  isHost: boolean;
  xpAwarded: number;
}

export interface DuelQuestionPublic {
  id: string;
  chapterTitle: string;
  gradeLevel: string;
  exerciseType: 'quiz' | 'practice';
  prompt: string;
  options: string[] | null;
}

export interface DuelRoomState {
  code: string;
  subject: SubjectId | 'all';
  gradeLevel: GradeLevel;
  status: 'waiting' | 'active' | 'finished';
  currentIndex: number;
  totalQuestions: number;
  questionTimeLimitMs: number;
  questionStartedAt: number | null;
  currentQuestion: DuelQuestionPublic | null;
  participants: DuelParticipantPublic[];
  myClientId: string;
  lastRoundReveal: {
    questionId: string;
    prompt: string;
    correctAnswer: string;
    explanation: string;
  } | null;
}
