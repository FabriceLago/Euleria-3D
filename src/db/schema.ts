import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull().default('Élève'),
  avatarUrl: text('avatar_url'),
  gradeLevel: text('grade_level').notNull().default('6e'),
  xp: integer('xp').notNull().default(0),
  streakDays: integer('streak_days').notNull().default(1),
  themeMode: text('theme_mode').notNull().default('light'),
  accentColor: text('accent_color').notNull().default('indigo'),
  layoutDensity: text('layout_density').notNull().default('comfortable'),
  show3DHints: boolean('show_3d_hints').notNull().default(true),
  weeklyXpGoal: integer('weekly_xp_goal').notNull().default(400),
  // Classement public : opt-in explicite, sous un pseudonyme tiré au sort (jamais le nom ni la photo)
  leaderboardOptIn: boolean('leaderboard_opt_in').notNull().default(false),
  pseudonym: text('pseudonym').unique(),
  lastActiveAt: timestamp('last_active_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chapters = pgTable('chapters', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  subject: text('subject').notNull().default('mathematics'),
  gradeLevel: text('grade_level').notNull(), // '6e' | '5e' | '4e' | '3e' | '2nde' | '1ere' | 'terminale'
  orderIndex: integer('order_index').notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  summary: text('summary').notNull(),
  theoryContent: text('theory_content').notNull(),
  formulaDisplay: text('formula_display').notNull(),
  scenePreset: text('scene_preset').notNull(),
  defaultParamsJson: text('default_params_json').notNull(),
  xpReward: integer('xp_reward').notNull().default(120),
  estimatedMinutes: integer('estimated_minutes').notNull().default(20),
});

export const exercises = pgTable('exercises', {
  id: serial('id').primaryKey(),
  chapterId: integer('chapter_id')
    .references(() => chapters.id, { onDelete: 'cascade' })
    .notNull(),
  orderIndex: integer('order_index').notNull(),
  exerciseType: text('exercise_type').notNull(), // 'quiz' | 'practice'
  prompt: text('prompt').notNull(),
  hint: text('hint').notNull(),
  optionsJson: text('options_json'), // JSON string array for MCQ, null for numeric input
  correctAnswer: text('correct_answer').notNull(),
  numericTolerance: real('numeric_tolerance').default(0.05),
  explanation: text('explanation').notNull(),
  xpValue: integer('xp_value').notNull().default(35),
});

export const userProgress = pgTable(
  'user_progress',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    chapterId: integer('chapter_id')
      .references(() => chapters.id, { onDelete: 'cascade' })
      .notNull(),
    completedExercisesCount: integer('completed_exercises_count').notNull().default(0),
    totalExercisesCount: integer('total_exercises_count').notNull().default(3),
    masteryScore: real('mastery_score').notNull().default(0),
    predictedSuccessRate: real('predicted_success_rate').notNull().default(50),
    status: text('status').notNull().default('not_started'), // 'not_started' | 'in_progress' | 'completed'
    lastPracticedAt: timestamp('last_practiced_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
  },
  (table) => [uniqueIndex('user_progress_user_chapter_idx').on(table.userId, table.chapterId)]
);

export const quizAttempts = pgTable('quiz_attempts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  chapterId: integer('chapter_id')
    .references(() => chapters.id, { onDelete: 'cascade' })
    .notNull(),
  exerciseId: integer('exercise_id')
    .references(() => exercises.id, { onDelete: 'cascade' })
    .notNull(),
  submittedAnswer: text('submitted_answer').notNull(),
  isCorrect: boolean('is_correct').notNull(),
  responseTimeMs: integer('response_time_ms').notNull().default(5000),
  xpEarned: integer('xp_earned').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const badges = pgTable('badges', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  iconName: text('icon_name').notNull(),
  xpThreshold: integer('xp_threshold').notNull().default(0),
  conditionType: text('condition_type').notNull(), // 'xp' | 'chapters_completed' | 'streak' | 'prediction_master' | 'collaboration'
});

export const userBadges = pgTable(
  'user_badges',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    badgeId: integer('badge_id')
      .references(() => badges.id, { onDelete: 'cascade' })
      .notNull(),
    awardedAt: timestamp('awarded_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('user_badges_user_badge_idx').on(table.userId, table.badgeId)]
);

export const studyRooms = pgTable('study_rooms', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  gradeLevel: text('grade_level').notNull(),
  topic: text('topic').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  roomId: integer('room_id')
    .references(() => studyRooms.id, { onDelete: 'cascade' })
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  content: text('content').notNull(),
  sharedChapterId: integer('shared_chapter_id').references(() => chapters.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const examSessions = pgTable('exam_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  examSlug: text('exam_slug').notNull(),
  examTitle: text('exam_title').notNull(),
  gradeLabel: text('grade_label').notNull(),
  scoreOn20: real('score_on_20').notNull(),
  correctCount: integer('correct_count').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  mention: text('mention').notNull(),
  durationSeconds: integer('duration_seconds').notNull().default(0),
  xpAwarded: integer('xp_awarded').notNull().default(0),
  subjectBreakdownJson: text('subject_breakdown_json').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const flashcardReviews = pgTable(
  'flashcard_reviews',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    chapterId: integer('chapter_id')
      .references(() => chapters.id, { onDelete: 'cascade' })
      .notNull(),
    cardKey: text('card_key').notNull(),
    easeFactor: real('ease_factor').notNull().default(2.5),
    intervalDays: integer('interval_days').notNull().default(0),
    repetitions: integer('repetitions').notNull().default(0),
    lastRating: text('last_rating').notNull().default('good'),
    nextReviewAt: timestamp('next_review_at').defaultNow().notNull(),
    lastReviewedAt: timestamp('last_reviewed_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('flashcard_reviews_user_chapter_card_idx').on(
      table.userId,
      table.chapterId,
      table.cardKey
    ),
  ]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  progress: many(userProgress),
  attempts: many(quizAttempts),
  badges: many(userBadges),
  messages: many(chatMessages),
  exams: many(examSessions),
  flashcardReviews: many(flashcardReviews),
}));

export const examSessionsRelations = relations(examSessions, ({ one }) => ({
  user: one(users, {
    fields: [examSessions.userId],
    references: [users.id],
  }),
}));

export const flashcardReviewsRelations = relations(flashcardReviews, ({ one }) => ({
  user: one(users, {
    fields: [flashcardReviews.userId],
    references: [users.id],
  }),
  chapter: one(chapters, {
    fields: [flashcardReviews.chapterId],
    references: [chapters.id],
  }),
}));

export const chaptersRelations = relations(chapters, ({ many }) => ({
  exercises: many(exercises),
  progress: many(userProgress),
}));

export const exercisesRelations = relations(exercises, ({ one }) => ({
  chapter: one(chapters, {
    fields: [exercises.chapterId],
    references: [chapters.id],
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  chapter: one(chapters, {
    fields: [userProgress.chapterId],
    references: [chapters.id],
  }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  user: one(users, {
    fields: [quizAttempts.userId],
    references: [users.id],
  }),
  chapter: one(chapters, {
    fields: [quizAttempts.chapterId],
    references: [chapters.id],
  }),
  exercise: one(exercises, {
    fields: [quizAttempts.exerciseId],
    references: [exercises.id],
  }),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  room: one(studyRooms, {
    fields: [chatMessages.roomId],
    references: [studyRooms.id],
  }),
  author: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
  sharedChapter: one(chapters, {
    fields: [chatMessages.sharedChapterId],
    references: [chapters.id],
  }),
}));
