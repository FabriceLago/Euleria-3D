export type GradeLevel = '6e' | '5e' | '4e' | '3e' | '2nde' | '1ere' | 'terminale';
export type SubjectId = 'mathematics' | 'physics_chemistry' | 'databases_sql';
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

export interface LeaderboardEntry {
  id: number;
  uid: string;
  displayName: string;
  avatarUrl: string | null;
  gradeLevel: GradeLevel;
  xp: number;
  streakDays: number;
  lastActiveAt: string;
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
