import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  badges,
  chapters,
  chatMessages,
  examSessions,
  exercises,
  flashcardReviews,
  quizAttempts,
  studyRooms,
  userBadges,
  userProgress,
  users,
} from './schema.ts';
import { ALL_SEED_BADGES, ALL_SEED_CHAPTERS, ALL_SEED_ROOMS } from './curriculumData.ts';
import { computeRealTimePrediction, evaluateExerciseAnswer } from '../services/predictionEngine.ts';
import {
  buildChapterFlashcards,
  buildChapterStudySheet,
  computeSm2NextState,
  type FlashcardRating,
} from '../services/flashcardEngine.ts';

export class ValidationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
  }
}

let seedPromise: Promise<void> | null = null;

export async function ensureCurriculumSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runIdempotentSeed().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

async function runIdempotentSeed(): Promise<void> {
  try {
    const existingChapterRows = await db.select({ slug: chapters.slug }).from(chapters);
    const existingChapterSlugs = new Set(existingChapterRows.map((r) => r.slug));

    for (const ch of ALL_SEED_CHAPTERS) {
      if (existingChapterSlugs.has(ch.slug)) continue;

      const insertedChapter = await db
        .insert(chapters)
        .values({
          slug: ch.slug,
          subject: ch.subject || 'mathematics',
          gradeLevel: ch.gradeLevel,
          orderIndex: ch.orderIndex,
          title: ch.title,
          subtitle: ch.subtitle,
          summary: ch.summary,
          theoryContent: ch.theoryContent,
          formulaDisplay: ch.formulaDisplay,
          scenePreset: ch.scenePreset,
          defaultParamsJson: JSON.stringify(ch.defaultParams),
          xpReward: ch.xpReward,
          estimatedMinutes: ch.estimatedMinutes,
        })
        .onConflictDoNothing({ target: chapters.slug })
        .returning();

      const chapterRow =
        insertedChapter[0] ||
        (await db.select().from(chapters).where(eq(chapters.slug, ch.slug)).limit(1))[0];

      if (chapterRow) {
        const existingEx = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(exercises)
          .where(eq(exercises.chapterId, chapterRow.id));

        if ((existingEx[0]?.count ?? 0) === 0) {
          await db.insert(exercises).values(
            ch.exercises.map((ex) => ({
              chapterId: chapterRow.id,
              orderIndex: ex.orderIndex,
              exerciseType: ex.exerciseType,
              prompt: ex.prompt,
              hint: ex.hint,
              optionsJson: ex.options ? JSON.stringify(ex.options) : null,
              correctAnswer: ex.correctAnswer,
              numericTolerance: ex.numericTolerance,
              explanation: ex.explanation,
              xpValue: ex.xpValue,
            }))
          );
        }
      }
    }

    const existingBadgeRows = await db.select({ slug: badges.slug }).from(badges);
    const existingBadgeSlugs = new Set(existingBadgeRows.map((r) => r.slug));
    const missingBadges = ALL_SEED_BADGES.filter((b) => !existingBadgeSlugs.has(b.slug));
    if (missingBadges.length > 0) {
      await db.insert(badges).values(missingBadges).onConflictDoNothing({ target: badges.slug });
    }

    const existingRoomRows = await db.select({ slug: studyRooms.slug }).from(studyRooms);
    const existingRoomSlugs = new Set(existingRoomRows.map((r) => r.slug));
    const missingRooms = ALL_SEED_ROOMS.filter((r) => !existingRoomSlugs.has(r.slug));
    if (missingRooms.length > 0) {
      await db.insert(studyRooms).values(missingRooms).onConflictDoNothing({ target: studyRooms.slug });
    }
  } catch (error) {
    console.error('Database error during ensureCurriculumSeeded:', error);
    throw new Error('Impossible d’initialiser le programme pédagogique.', { cause: error });
  }
}

export async function getFullCurriculum() {
  try {
    await ensureCurriculumSeeded();

    const allChapters = await db
      .select()
      .from(chapters)
      .orderBy(asc(chapters.orderIndex), asc(chapters.id));

    const allExercises = await db
      .select({
        id: exercises.id,
        chapterId: exercises.chapterId,
        orderIndex: exercises.orderIndex,
        exerciseType: exercises.exerciseType,
        prompt: exercises.prompt,
        hint: exercises.hint,
        optionsJson: exercises.optionsJson,
        xpValue: exercises.xpValue,
      })
      .from(exercises)
      .orderBy(asc(exercises.orderIndex));

    const exercisesByChapter = new Map<number, typeof allExercises>();
    for (const ex of allExercises) {
      const list = exercisesByChapter.get(ex.chapterId) || [];
      list.push(ex);
      exercisesByChapter.set(ex.chapterId, list);
    }

    return allChapters.map((ch) => ({
      ...ch,
      defaultParams: JSON.parse(ch.defaultParamsJson) as Record<string, number>,
      exercises: (exercisesByChapter.get(ch.id) || []).map((ex) => ({
        ...ex,
        options: ex.optionsJson ? (JSON.parse(ex.optionsJson) as string[]) : null,
      })),
    }));
  } catch (error) {
    console.error('Database error in getFullCurriculum:', error);
    throw new Error('Impossible de charger le programme pédagogique.', { cause: error });
  }
}

export async function getUserDashboardData(userId: number) {
  try {
    await ensureCurriculumSeeded();

    const progressRows = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));

    const attemptRows = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.createdAt))
      .limit(100);

    const allBadges = await db.select().from(badges).orderBy(asc(badges.id));
    const earnedBadges = await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId));

    const earnedMap = new Map<number, Date>();
    for (const eb of earnedBadges) {
      earnedMap.set(eb.badgeId, eb.awardedAt);
    }

    const overallPrediction = computeRealTimePrediction(
      attemptRows.map((a) => ({
        isCorrect: a.isCorrect,
        responseTimeMs: a.responseTimeMs,
        createdAt: a.createdAt,
      })),
      progressRows.length || 1,
      progressRows.filter((p) => p.status === 'completed').length
    );

    return {
      progress: progressRows,
      recentAttempts: attemptRows.slice(0, 30),
      badges: allBadges.map((b) => ({
        ...b,
        earned: earnedMap.has(b.id),
        awardedAt: earnedMap.get(b.id) || null,
      })),
      overallPrediction,
    };
  } catch (error) {
    console.error('Database error in getUserDashboardData:', error);
    throw new Error('Impossible de charger la progression de l’élève.', { cause: error });
  }
}

export async function recordExerciseAttempt(params: {
  userId: number;
  exerciseId: number;
  submittedAnswer: string;
  responseTimeMs: number;
}) {
  try {
    const exRows = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, params.exerciseId))
      .limit(1);

    const exercise = exRows[0];
    if (!exercise) {
      throw new ValidationError('Exercice introuvable.', 404);
    }

    const cleanAnswer = params.submittedAnswer.trim().slice(0, 256);
    if (!cleanAnswer) {
      throw new ValidationError('Réponse vide.', 400);
    }

    const chapterExercises = await db
      .select()
      .from(exercises)
      .where(eq(exercises.chapterId, exercise.chapterId));

    const isCorrect = evaluateExerciseAnswer(
      exercise.exerciseType,
      cleanAnswer,
      exercise.correctAnswer,
      exercise.numericTolerance ?? 0.05
    );

    const priorCorrectRows = await db
      .select({
        id: quizAttempts.id,
        xpEarned: quizAttempts.xpEarned,
        createdAt: quizAttempts.createdAt,
      })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, params.userId),
          eq(quizAttempts.exerciseId, exercise.id),
          eq(quizAttempts.isCorrect, true)
        )
      )
      .orderBy(desc(quizAttempts.createdAt))
      .limit(10);

    const alreadySolved = priorCorrectRows.length > 0;
    const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
    const recentlyRewarded = priorCorrectRows.some(
      (row) => row.xpEarned > 0 && row.createdAt.getTime() > twelveHoursAgo
    );
    const xpEarned = isCorrect
      ? alreadySolved
        ? recentlyRewarded
          ? 0
          : 5
        : exercise.xpValue
      : 0;

    // Enregistrement de la tentative
    await db.insert(quizAttempts).values({
      userId: params.userId,
      chapterId: exercise.chapterId,
      exerciseId: exercise.id,
      submittedAnswer: cleanAnswer,
      isCorrect,
      responseTimeMs: Math.max(500, Math.min(params.responseTimeMs || 6000, 300000)),
      xpEarned,
    });

    // Mise à jour XP utilisateur
    if (xpEarned > 0) {
      await db
        .update(users)
        .set({
          xp: sql`${users.xp} + ${xpEarned}`,
          lastActiveAt: new Date(),
        })
        .where(eq(users.id, params.userId));
    }

    // Recalcul prédictif BKT + EWMA sur le chapitre
    const chapterAttempts = await db
      .select()
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, params.userId),
          eq(quizAttempts.chapterId, exercise.chapterId)
        )
      )
      .orderBy(asc(quizAttempts.createdAt));

    const solvedExerciseIds = new Set(
      chapterAttempts.filter((a) => a.isCorrect).map((a) => a.exerciseId)
    );
    const completedCount = solvedExerciseIds.size;
    const totalCount = chapterExercises.length;

    const prediction = computeRealTimePrediction(
      chapterAttempts.map((a) => ({
        isCorrect: a.isCorrect,
        responseTimeMs: a.responseTimeMs,
        createdAt: a.createdAt,
      })),
      totalCount,
      completedCount
    );

    const status =
      completedCount >= totalCount && totalCount > 0
        ? 'completed'
        : chapterAttempts.length > 0
          ? 'in_progress'
          : 'not_started';

    const existingProg = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, params.userId),
          eq(userProgress.chapterId, exercise.chapterId)
        )
      )
      .limit(1);

    const wasAlreadyCompleted = existingProg[0]?.status === 'completed';

    let bonusChapterXp = 0;
    if (status === 'completed' && !wasAlreadyCompleted) {
      const chRow = await db
        .select({ xpReward: chapters.xpReward })
        .from(chapters)
        .where(eq(chapters.id, exercise.chapterId))
        .limit(1);
      bonusChapterXp = chRow[0]?.xpReward ?? 100;
      await db
        .update(users)
        .set({ xp: sql`${users.xp} + ${bonusChapterXp}` })
        .where(eq(users.id, params.userId));
    }

    const [updatedProgress] = await db
      .insert(userProgress)
      .values({
        userId: params.userId,
        chapterId: exercise.chapterId,
        completedExercisesCount: completedCount,
        totalExercisesCount: totalCount,
        masteryScore: prediction.masteryScore,
        predictedSuccessRate: prediction.predictedSuccessRate,
        status,
        lastPracticedAt: new Date(),
        completedAt: status === 'completed' ? new Date() : null,
      })
      .onConflictDoUpdate({
        target: [userProgress.userId, userProgress.chapterId],
        set: {
          completedExercisesCount: completedCount,
          totalExercisesCount: totalCount,
          masteryScore: prediction.masteryScore,
          predictedSuccessRate: prediction.predictedSuccessRate,
          status,
          lastPracticedAt: new Date(),
          completedAt:
            status === 'completed' ? existingProg[0]?.completedAt || new Date() : null,
        },
      })
      .returning();

    const newlyUnlockedBadges = await evaluateAndAwardBadges(params.userId);
    const [freshUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1);

    return {
      isCorrect,
      xpEarned: xpEarned + bonusChapterXp,
      bonusChapterXp,
      explanation: exercise.explanation,
      correctAnswer: exercise.correctAnswer,
      progress: updatedProgress,
      prediction,
      newlyUnlockedBadges,
      userXp: freshUser?.xp ?? 0,
    };
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    console.error('Database error in recordExerciseAttempt:', error);
    throw new Error('Impossible d’enregistrer votre réponse.', { cause: error });
  }
}

export async function evaluateAndAwardBadges(userId: number) {
  try {
    const [userRow] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!userRow) return [];

    const allBadges = await db.select().from(badges);
    const existing = await db
      .select({ badgeId: userBadges.badgeId })
      .from(userBadges)
      .where(eq(userBadges.userId, userId));
    const ownedSet = new Set(existing.map((e) => e.badgeId));

    const progressRows = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
    const completedChaptersCount = progressRows.filter((p) => p.status === 'completed').length;
    const maxPrediction = progressRows.reduce(
      (max, p) => Math.max(max, p.predictedSuccessRate),
      0
    );

    const msgCountRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId));
    const messageCount = msgCountRows[0]?.count ?? 0;

    const examBestRows = await db
      .select({ maxScore: sql<number>`coalesce(max(${examSessions.scoreOn20}), 0)::real` })
      .from(examSessions)
      .where(eq(examSessions.userId, userId));
    const bestExamScore = examBestRows[0]?.maxScore ?? 0;

    const masteredFlashcardRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(flashcardReviews)
      .where(
        and(
          eq(flashcardReviews.userId, userId),
          sql`${flashcardReviews.repetitions} >= 1`,
          sql`${flashcardReviews.intervalDays} >= 1`
        )
      );
    const masteredFlashcardsCount = masteredFlashcardRows[0]?.count ?? 0;

    const newlyAwarded: Array<(typeof allBadges)[number]> = [];

    for (const badge of allBadges) {
      if (ownedSet.has(badge.id)) continue;

      let qualifies = false;
      if (badge.conditionType === 'xp' && userRow.xp >= badge.xpThreshold) {
        qualifies = true;
      } else if (
        badge.conditionType === 'chapters_completed' &&
        completedChaptersCount >= badge.xpThreshold
      ) {
        qualifies = true;
      } else if (
        badge.conditionType === 'prediction_master' &&
        maxPrediction >= badge.xpThreshold
      ) {
        qualifies = true;
      } else if (badge.conditionType === 'collaboration' && messageCount >= badge.xpThreshold) {
        qualifies = true;
      } else if (badge.conditionType === 'exam_honors' && bestExamScore >= badge.xpThreshold) {
        qualifies = true;
      } else if (
        badge.conditionType === 'flashcards_mastered' &&
        masteredFlashcardsCount >= badge.xpThreshold
      ) {
        qualifies = true;
      }

      if (qualifies) {
        await db
          .insert(userBadges)
          .values({ userId, badgeId: badge.id })
          .onConflictDoNothing();
        newlyAwarded.push(badge);
      }
    }

    return newlyAwarded;
  } catch (error) {
    console.error('Database error in evaluateAndAwardBadges:', error);
    return [];
  }
}

export async function getStudyRoomsWithMessages(roomSlug?: string) {
  try {
    await ensureCurriculumSeeded();
    const rooms = await db.select().from(studyRooms).orderBy(asc(studyRooms.id));
    const activeRoom =
      (roomSlug ? rooms.find((r) => r.slug === roomSlug) : rooms[0]) || rooms[0];

    if (!activeRoom) {
      return { rooms: [], activeRoom: null, messages: [] };
    }

    const rawMessages = await db
      .select({
        id: chatMessages.id,
        roomId: chatMessages.roomId,
        content: chatMessages.content,
        sharedChapterId: chatMessages.sharedChapterId,
        createdAt: chatMessages.createdAt,
        authorId: users.id,
        authorName: users.displayName,
        authorGrade: users.gradeLevel,
        authorAvatar: users.avatarUrl,
        authorXp: users.xp,
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.userId, users.id))
      .where(eq(chatMessages.roomId, activeRoom.id))
      .orderBy(desc(chatMessages.createdAt))
      .limit(60);

    return {
      rooms,
      activeRoom,
      messages: rawMessages.reverse(),
    };
  } catch (error) {
    console.error('Database error in getStudyRoomsWithMessages:', error);
    throw new Error('Impossible de charger les salons de discussion.', { cause: error });
  }
}

export async function createChatMessage(params: {
  roomSlug: string;
  userId: number;
  content: string;
  sharedChapterId?: number | null;
}) {
  try {
    await ensureCurriculumSeeded();
    const [room] = await db
      .select()
      .from(studyRooms)
      .where(eq(studyRooms.slug, params.roomSlug))
      .limit(1);

    if (!room) {
      throw new ValidationError('Salon introuvable.', 404);
    }

    const cleanContent = params.content.trim().slice(0, 1000);
    if (!cleanContent) {
      throw new ValidationError('Le message ne peut pas être vide.', 400);
    }

    let validSharedChapterId: number | null = null;
    if (params.sharedChapterId !== undefined && params.sharedChapterId !== null) {
      if (!Number.isInteger(params.sharedChapterId) || params.sharedChapterId <= 0) {
        throw new ValidationError('Chapitre partagé invalide.', 400);
      }
      const [sharedChapter] = await db
        .select({ id: chapters.id })
        .from(chapters)
        .where(eq(chapters.id, params.sharedChapterId))
        .limit(1);
      if (!sharedChapter) {
        throw new ValidationError('Chapitre partagé introuvable.', 400);
      }
      validSharedChapterId = sharedChapter.id;
    }

    const [inserted] = await db
      .insert(chatMessages)
      .values({
        roomId: room.id,
        userId: params.userId,
        content: cleanContent,
        sharedChapterId: validSharedChapterId,
      })
      .returning();

    const [author] = await db
      .select()
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1);

    const newlyUnlockedBadges = await evaluateAndAwardBadges(params.userId);

    return {
      message: {
        id: inserted.id,
        roomId: inserted.roomId,
        roomSlug: room.slug,
        content: inserted.content,
        sharedChapterId: inserted.sharedChapterId,
        createdAt: inserted.createdAt,
        authorId: author?.id ?? params.userId,
        authorName: author?.displayName ?? 'Élève',
        authorGrade: author?.gradeLevel ?? '6e',
        authorAvatar: author?.avatarUrl ?? null,
        authorXp: author?.xp ?? 0,
      },
      newlyUnlockedBadges,
    };
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    console.error('Database error in createChatMessage:', error);
    throw new Error('Impossible d’envoyer le message.', { cause: error });
  }
}

export async function getChapterExercisesForGenerator(chapterIds: number[]) {
  try {
    await ensureCurriculumSeeded();
    if (chapterIds.length === 0) return new Map();

    const allEx = await db
      .select()
      .from(exercises)
      .orderBy(asc(exercises.chapterId), asc(exercises.orderIndex));

    const idSet = new Set(chapterIds);
    const map = new Map<
      number,
      Array<{
        chapterId: number;
        orderIndex: number;
        exerciseType: 'quiz' | 'practice';
        prompt: string;
        hint: string;
        options: string[] | null;
        correctAnswer: string;
        numericTolerance: number;
        explanation: string;
        xpValue: number;
      }>
    >();

    for (const ex of allEx) {
      if (!idSet.has(ex.chapterId)) continue;
      const list = map.get(ex.chapterId) || [];
      list.push({
        chapterId: ex.chapterId,
        orderIndex: ex.orderIndex,
        exerciseType: ex.exerciseType === 'quiz' ? 'quiz' : 'practice',
        prompt: ex.prompt,
        hint: ex.hint,
        options: ex.optionsJson ? (JSON.parse(ex.optionsJson) as string[]) : null,
        correctAnswer: ex.correctAnswer,
        numericTolerance: ex.numericTolerance ?? 0.05,
        explanation: ex.explanation,
        xpValue: ex.xpValue,
      });
      map.set(ex.chapterId, list);
    }

    return map;
  } catch (error) {
    console.error('Database error in getChapterExercisesForGenerator:', error);
    throw new Error('Impossible de charger les exercices pour le quiz dynamique.', { cause: error });
  }
}

export async function awardDynamicQuizXp(userId: number, xpEarned: number) {
  try {
    const safeXp = Math.max(0, Math.min(500, Math.round(xpEarned)));
    if (safeXp > 0) {
      await db
        .update(users)
        .set({
          xp: sql`${users.xp} + ${safeXp}`,
          lastActiveAt: new Date(),
        })
        .where(eq(users.id, userId));
    }

    const newlyUnlockedBadges = await evaluateAndAwardBadges(userId);
    const [freshUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return {
      userXp: freshUser?.xp ?? 0,
      newlyUnlockedBadges,
    };
  } catch (error) {
    console.error('Database error in awardDynamicQuizXp:', error);
    throw new Error('Impossible d’enregistrer les points XP du quiz dynamique.', { cause: error });
  }
}

export async function recordExamSession(params: {
  userId: number;
  examSlug: string;
  examTitle: string;
  gradeLabel: string;
  scoreOn20: number;
  correctCount: number;
  totalQuestions: number;
  mention: string;
  durationSeconds: number;
  xpAwarded: number;
  subjectBreakdown: Array<{
    subject: string;
    label: string;
    correct: number;
    total: number;
    scoreOn20: number;
  }>;
}) {
  try {
    const safeXp = Math.max(0, Math.min(400, Math.round(params.xpAwarded)));
    const [inserted] = await db
      .insert(examSessions)
      .values({
        userId: params.userId,
        examSlug: params.examSlug,
        examTitle: params.examTitle,
        gradeLabel: params.gradeLabel,
        scoreOn20: params.scoreOn20,
        correctCount: params.correctCount,
        totalQuestions: params.totalQuestions,
        mention: params.mention,
        durationSeconds: Math.max(1, Math.round(params.durationSeconds)),
        xpAwarded: safeXp,
        subjectBreakdownJson: JSON.stringify(params.subjectBreakdown),
      })
      .returning();

    if (safeXp > 0) {
      await db
        .update(users)
        .set({
          xp: sql`${users.xp} + ${safeXp}`,
          lastActiveAt: new Date(),
        })
        .where(eq(users.id, params.userId));
    }

    const newlyUnlockedBadges = await evaluateAndAwardBadges(params.userId);
    const [freshUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1);

    return {
      sessionId: inserted?.id ?? null,
      userXp: freshUser?.xp ?? 0,
      newlyUnlockedBadges,
    };
  } catch (error) {
    console.error('Database error in recordExamSession:', error);
    throw new Error('Impossible d’enregistrer la copie d’examen blanc.', { cause: error });
  }
}

export async function getUserExamHistory(userId: number, limit = 15) {
  try {
    const rows = await db
      .select()
      .from(examSessions)
      .where(eq(examSessions.userId, userId))
      .orderBy(desc(examSessions.createdAt))
      .limit(limit);

    const history = rows.map((row) => ({
      id: row.id,
      examSlug: row.examSlug,
      examTitle: row.examTitle,
      gradeLabel: row.gradeLabel,
      scoreOn20: row.scoreOn20,
      correctCount: row.correctCount,
      totalQuestions: row.totalQuestions,
      mention: row.mention,
      durationSeconds: row.durationSeconds,
      xpAwarded: row.xpAwarded,
      subjectBreakdown: JSON.parse(row.subjectBreakdownJson) as Array<{
        subject: string;
        label: string;
        correct: number;
        total: number;
        scoreOn20: number;
      }>,
      createdAt: row.createdAt.toISOString(),
    }));

    const totalExams = history.length;
    const bestScoreOn20 =
      totalExams > 0 ? Math.max(...history.map((h) => h.scoreOn20)) : null;
    const averageScoreOn20 =
      totalExams > 0
        ? Math.round(
            (history.reduce((sum, h) => sum + h.scoreOn20, 0) / totalExams) * 10
          ) / 10
        : null;

    return {
      history,
      summary: {
        totalExams,
        bestScoreOn20,
        averageScoreOn20,
      },
    };
  } catch (error) {
    console.error('Database error in getUserExamHistory:', error);
    throw new Error('Impossible de charger l’historique des examens blancs.', { cause: error });
  }
}

export async function getChapterFlashcardsAndSheet(chapterId: number, userId: number | null) {
  try {
    await ensureCurriculumSeeded();
    const [chapterRow] = await db
      .select()
      .from(chapters)
      .where(eq(chapters.id, chapterId))
      .limit(1);

    if (!chapterRow) {
      return null;
    }

    const chapterExercises = await db
      .select()
      .from(exercises)
      .where(eq(exercises.chapterId, chapterId))
      .orderBy(asc(exercises.orderIndex));

    const reviewMap = new Map<
      string,
      {
        easeFactor: number;
        intervalDays: number;
        repetitions: number;
        lastRating: string;
        nextReviewAt: Date;
        lastReviewedAt: Date;
      }
    >();

    if (userId) {
      const reviewRows = await db
        .select()
        .from(flashcardReviews)
        .where(
          and(
            eq(flashcardReviews.userId, userId),
            eq(flashcardReviews.chapterId, chapterId)
          )
        );
      for (const r of reviewRows) {
        reviewMap.set(r.cardKey, {
          easeFactor: r.easeFactor,
          intervalDays: r.intervalDays,
          repetitions: r.repetitions,
          lastRating: r.lastRating,
          nextReviewAt: r.nextReviewAt,
          lastReviewedAt: r.lastReviewedAt,
        });
      }
    }

    const sourceExercises = chapterExercises.map((ex) => ({
      orderIndex: ex.orderIndex,
      prompt: ex.prompt,
      hint: ex.hint,
      correctAnswer: ex.correctAnswer,
      explanation: ex.explanation,
    }));

    const studySheet = buildChapterStudySheet(chapterRow, sourceExercises);
    const flashcards = buildChapterFlashcards(chapterRow, sourceExercises, reviewMap);
    const masteredCount = flashcards.filter((c) => c.sm2.isMastered).length;
    const dueCount = flashcards.filter((c) => c.sm2.isDue).length;

    return {
      chapterId,
      studySheet,
      flashcards,
      stats: {
        totalCards: flashcards.length,
        masteredCount,
        dueCount,
      },
    };
  } catch (error) {
    console.error('Database error in getChapterFlashcardsAndSheet:', error);
    throw new Error('Impossible de charger les fiches et flashcards du chapitre.', { cause: error });
  }
}

export async function assertValidChapterCardKey(
  chapterId: number,
  cardKey: string
): Promise<void> {
  await ensureCurriculumSeeded();
  const [chapterRow] = await db
    .select({ id: chapters.id })
    .from(chapters)
    .where(eq(chapters.id, chapterId))
    .limit(1);

  if (!chapterRow) {
    throw new ValidationError('Chapitre introuvable.', 404);
  }

  if (cardKey === 'concept' || cardKey === 'formula') {
    return;
  }

  const chapterExercises = await db
    .select({ orderIndex: exercises.orderIndex })
    .from(exercises)
    .where(eq(exercises.chapterId, chapterId))
    .orderBy(asc(exercises.orderIndex));

  const validKeys = new Set<string>(['concept', 'formula']);
  chapterExercises.forEach((ex, idx) => {
    validKeys.add(`ex-${ex.orderIndex || idx + 1}`);
  });

  if (!validKeys.has(cardKey)) {
    throw new ValidationError('Flashcard introuvable pour ce chapitre.', 400);
  }
}

export async function recordFlashcardReview(params: {
  userId: number;
  chapterId: number;
  cardKey: string;
  rating: FlashcardRating;
}) {
  try {
    await assertValidChapterCardKey(params.chapterId, params.cardKey);

    const existingRows = await db
      .select()
      .from(flashcardReviews)
      .where(
        and(
          eq(flashcardReviews.userId, params.userId),
          eq(flashcardReviews.chapterId, params.chapterId),
          eq(flashcardReviews.cardKey, params.cardKey)
        )
      )
      .limit(1);

    const existing = existingRows[0];
    const now = new Date();
    const next = computeSm2NextState(
      {
        easeFactor: existing?.easeFactor ?? 2.5,
        intervalDays: existing?.intervalDays ?? 0,
        repetitions: existing?.repetitions ?? 0,
      },
      params.rating,
      now
    );

    // Prime de +5 XP pour une révision réussie (good/easy), limitée à 1 fois par carte toutes les 12h
    const twelveHoursAgo = now.getTime() - 12 * 60 * 60 * 1000;
    // Sans condition sur repetitions : sinon "again" puis "good" redonne l'XP en boucle
    const recentlyReviewed = existing && existing.lastReviewedAt.getTime() > twelveHoursAgo;
    const xpEarned =
      (params.rating === 'good' || params.rating === 'easy') && !recentlyReviewed ? 5 : 0;

    await db
      .insert(flashcardReviews)
      .values({
        userId: params.userId,
        chapterId: params.chapterId,
        cardKey: params.cardKey,
        easeFactor: next.easeFactor,
        intervalDays: next.intervalDays,
        repetitions: next.repetitions,
        lastRating: next.lastRating,
        nextReviewAt: next.nextReviewAt,
        lastReviewedAt: next.lastReviewedAt,
      })
      .onConflictDoUpdate({
        target: [flashcardReviews.userId, flashcardReviews.chapterId, flashcardReviews.cardKey],
        set: {
          easeFactor: next.easeFactor,
          intervalDays: next.intervalDays,
          repetitions: next.repetitions,
          lastRating: next.lastRating,
          nextReviewAt: next.nextReviewAt,
          lastReviewedAt: next.lastReviewedAt,
        },
      });

    if (xpEarned > 0) {
      await db
        .update(users)
        .set({
          xp: sql`${users.xp} + ${xpEarned}`,
          lastActiveAt: now,
        })
        .where(eq(users.id, params.userId));
    }

    const newlyUnlockedBadges = await evaluateAndAwardBadges(params.userId);
    const [freshUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, params.userId))
      .limit(1);

    return {
      sm2: {
        easeFactor: next.easeFactor,
        intervalDays: next.intervalDays,
        repetitions: next.repetitions,
        lastRating: next.lastRating,
        nextReviewAt: next.nextReviewAt.toISOString(),
        lastReviewedAt: next.lastReviewedAt.toISOString(),
        isDue: next.isDue,
        isMastered: next.isMastered,
      },
      xpEarned,
      userXp: freshUser?.xp ?? 0,
      newlyUnlockedBadges,
    };
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    console.error('Database error in recordFlashcardReview:', error);
    throw new Error('Impossible d’enregistrer la révision de la flashcard.', { cause: error });
  }
}

const STUDY_PLAN_SUBJECT_ORDER = [
  { id: 'mathematics', label: 'Mathématiques' },
  { id: 'physics_chemistry', label: 'Physique-Chimie' },
  { id: 'svt', label: 'SVT' },
  { id: 'history_geography', label: 'Histoire-Géographie' },
  { id: 'french_philosophy', label: 'Français & Philo' },
  { id: 'english_lv1', label: 'Anglais LV1' },
] as const;

const DAY_LABELS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export async function getUserStudyPlan(userId: number) {
  try {
    await ensureCurriculumSeeded();

    const [userRow] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const gradeLevel = (userRow?.gradeLevel || '6e') as string;
    const weeklyXpGoal = userRow?.weeklyXpGoal ?? 400;

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [allChapters, progressRows, recentAttempts, recentExams, allFlashcardRows] =
      await Promise.all([
        db.select().from(chapters).orderBy(asc(chapters.orderIndex), asc(chapters.id)),
        db.select().from(userProgress).where(eq(userProgress.userId, userId)),
        db
          .select()
          .from(quizAttempts)
          .where(eq(quizAttempts.userId, userId))
          .orderBy(desc(quizAttempts.createdAt))
          .limit(300),
        db
          .select()
          .from(examSessions)
          .where(eq(examSessions.userId, userId))
          .orderBy(desc(examSessions.createdAt))
          .limit(20),
        db.select().from(flashcardReviews).where(eq(flashcardReviews.userId, userId)),
      ]);

    // 1. Rythme sur 7 jours + XP hebdomadaire réel
    const dayBuckets = new Map<string, { dateIso: string; dayLabel: string; actionsCount: number; xpEarned: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      dayBuckets.set(iso, {
        dateIso: iso,
        dayLabel: DAY_LABELS_FR[d.getDay()],
        actionsCount: 0,
        xpEarned: 0,
      });
    }

    for (const att of recentAttempts) {
      const iso = att.createdAt.toISOString().slice(0, 10);
      const b = dayBuckets.get(iso);
      if (b) {
        b.actionsCount += 1;
        b.xpEarned += att.xpEarned;
      }
    }
    for (const ex of recentExams) {
      const iso = ex.createdAt.toISOString().slice(0, 10);
      const b = dayBuckets.get(iso);
      if (b) {
        b.actionsCount += 1;
        b.xpEarned += ex.xpAwarded;
      }
    }
    for (const fc of allFlashcardRows) {
      const iso = fc.lastReviewedAt.toISOString().slice(0, 10);
      const b = dayBuckets.get(iso);
      if (b) {
        b.actionsCount += 1;
        if (fc.repetitions >= 1 && (fc.lastRating === 'good' || fc.lastRating === 'easy')) {
          b.xpEarned += 5;
        }
      }
    }

    const dailyActivity = Array.from(dayBuckets.values());
    const weeklyXpEarned = dailyActivity.reduce((s, d) => s + d.xpEarned, 0);
    const weeklyActionsCount = dailyActivity.reduce((s, d) => s + d.actionsCount, 0);

    // 2. Radar SM-2 (cartes dues + maîtrisées)
    const chapterById = new Map(allChapters.map((c) => [c.id, c]));
    const subjectLabelMap = new Map<string, string>(
      STUDY_PLAN_SUBJECT_ORDER.map((s) => [s.id, s.label])
    );

    const dueCountByChapterId = new Map<number, number>();
    let dueFlashcardsCount = 0;
    let masteredFlashcardsCount = 0;

    for (const fc of allFlashcardRows) {
      if (fc.repetitions >= 1 && fc.intervalDays >= 1) {
        masteredFlashcardsCount += 1;
      }
      if (fc.nextReviewAt.getTime() <= now.getTime()) {
        dueFlashcardsCount += 1;
        dueCountByChapterId.set(fc.chapterId, (dueCountByChapterId.get(fc.chapterId) || 0) + 1);
      }
    }

    const dueByChapter = Array.from(dueCountByChapterId.entries())
      .map(([chapterId, dueCount]) => {
        const ch = chapterById.get(chapterId);
        if (!ch) return null;
        return {
          chapterId,
          chapterTitle: ch.title,
          subject: ch.subject,
          subjectLabel: subjectLabelMap.get(ch.subject) || ch.subject,
          gradeLevel: ch.gradeLevel,
          dueCount,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.dueCount - a.dueCount)
      .slice(0, 5);

    // 3. Agrégation des notes d'examens blancs par matière
    const examScoresBySubject = new Map<string, number[]>();
    for (const ex of recentExams) {
      try {
        const breakdown = JSON.parse(ex.subjectBreakdownJson) as Array<{
          subject: string;
          scoreOn20: number;
        }>;
        for (const item of breakdown) {
          const arr = examScoresBySubject.get(item.subject) || [];
          arr.push(item.scoreOn20);
          examScoresBySubject.set(item.subject, arr);
        }
      } catch {
        // Ignore malformed JSON
      }
    }

    const progressByChapterId = new Map(progressRows.map((p) => [p.chapterId, p]));

    // 4. Bilan par matière (6 matières du tronc commun)
    const subjectSummaries = STUDY_PLAN_SUBJECT_ORDER.map((subj) => {
      const gradeChs = allChapters.filter(
        (c) => c.subject === subj.id && c.gradeLevel === gradeLevel
      );
      const allSubjChs = allChapters.filter((c) => c.subject === subj.id);

      const gradeCompletedChapters = gradeChs.filter(
        (c) => progressByChapterId.get(c.id)?.status === 'completed'
      ).length;

      const startedSubjProgs = allSubjChs
        .map((c) => progressByChapterId.get(c.id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p));

      const avgMasteryPct =
        startedSubjProgs.length > 0
          ? Math.round(
              startedSubjProgs.reduce((sum, p) => sum + p.masteryScore, 0) /
                startedSubjProgs.length
            )
          : 0;

      const scores = examScoresBySubject.get(subj.id) || [];
      const avgExamScoreOn20 =
        scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
          : null;

      const dueCardsCount = allSubjChs.reduce(
        (sum, c) => sum + (dueCountByChapterId.get(c.id) || 0),
        0
      );

      let status: 'prioritaire' | 'en_cours' | 'solide' | 'a_decouvrir' = 'a_decouvrir';
      if (
        (avgExamScoreOn20 !== null && avgExamScoreOn20 < 12) ||
        (startedSubjProgs.length > 0 && avgMasteryPct < 50)
      ) {
        status = 'prioritaire';
      } else if (
        (avgExamScoreOn20 !== null && avgExamScoreOn20 >= 14) ||
        avgMasteryPct >= 75
      ) {
        status = 'solide';
      } else if (startedSubjProgs.length > 0 || avgExamScoreOn20 !== null || dueCardsCount > 0) {
        status = 'en_cours';
      }

      return {
        subject: subj.id,
        label: subj.label,
        gradeCompletedChapters,
        gradeTotalChapters: gradeChs.length,
        avgMasteryPct,
        avgExamScoreOn20,
        dueCardsCount,
        status,
      };
    });

    // 5. Classement des chapitres prioritaires à retravailler (Top 6)
    const subjectExamAvgMap = new Map(
      subjectSummaries.map((s) => [s.subject as string, s.avgExamScoreOn20])
    );

    const scoredCandidates = allChapters
      .filter((ch) => {
        const prog = progressByChapterId.get(ch.id);
        const due = dueCountByChapterId.get(ch.id) || 0;
        return ch.gradeLevel === gradeLevel || Boolean(prog) || due > 0;
      })
      .map((ch) => {
        const prog = progressByChapterId.get(ch.id);
        const masteryPct = Math.round(prog?.masteryScore ?? 0);
        const due = dueCountByChapterId.get(ch.id) || 0;
        const examAvg = subjectExamAvgMap.get(ch.subject) ?? null;
        const subjLabel = subjectLabelMap.get(ch.subject) || ch.subject;

        let score = 0;
        let reason = `Prochain chapitre recommandé en ${gradeLevel}`;
        let priorityLevel: 'haute' | 'moyenne' | 'decouverte' = 'decouverte';

        if (examAvg !== null && examAvg < 12 && prog?.status !== 'completed') {
          score += 90 - examAvg * 4;
          reason = `Moyenne d’examen blanc ${examAvg.toFixed(1).replace('.', ',')}/20 en ${subjLabel}`;
          priorityLevel = 'haute';
        }
        if (due > 0) {
          score += 45 + due * 10;
          reason =
            priorityLevel === 'haute'
              ? `${reason} · ${due} flashcard${due > 1 ? 's' : ''} à revoir`
              : `${due} flashcard${due > 1 ? 's' : ''} SM-2 à réviser aujourd’hui`;
          if (priorityLevel === 'decouverte') priorityLevel = 'haute';
        }
        if (prog && prog.status === 'in_progress') {
          score += 65 - masteryPct * 0.5;
          if (priorityLevel === 'decouverte') {
            reason = `Chapitre entamé — maîtrise BKT à ${masteryPct}%`;
            priorityLevel = masteryPct < 55 ? 'haute' : 'moyenne';
          }
        } else if (!prog && ch.gradeLevel === gradeLevel) {
          score += 20;
        } else if (prog?.status === 'completed' && due === 0) {
          score -= 50;
        }

        return {
          chapterId: ch.id,
          title: ch.title,
          subject: ch.subject,
          subjectLabel: subjLabel,
          gradeLevel: ch.gradeLevel,
          masteryPct,
          dueCardsCount: due,
          reason,
          priorityLevel,
          _score: score,
        };
      })
      .filter((c) => c._score > 0)
      .sort((a, b) => b._score - a._score);

    // Diversifie pour ne pas afficher 6 chapitres de la même matière en mode découverte
    const priorityChapters: Array<Omit<(typeof scoredCandidates)[number], '_score'>> = [];
    const perSubjCap = new Map<string, number>();
    for (const cand of scoredCandidates) {
      if (priorityChapters.length >= 6) break;
      const count = perSubjCap.get(cand.subject) || 0;
      if (count >= 2 && scoredCandidates.length > 6) continue;
      perSubjCap.set(cand.subject, count + 1);
      const { _score: _, ...clean } = cand;
      priorityChapters.push(clean);
    }

    const latestExamRow = recentExams[0] || null;

    return {
      gradeLevel,
      weeklyXpGoal,
      weeklyXpEarned,
      weeklyActionsCount,
      dailyActivity,
      dueFlashcardsCount,
      masteredFlashcardsCount,
      dueByChapter,
      subjectSummaries,
      priorityChapters,
      latestExam: latestExamRow
        ? {
            examTitle: latestExamRow.examTitle,
            scoreOn20: latestExamRow.scoreOn20,
            mention: latestExamRow.mention,
            createdAt: latestExamRow.createdAt.toISOString(),
          }
        : null,
    };
  } catch (error) {
    console.error('Database error in getUserStudyPlan:', error);
    throw new Error('Impossible de générer le tableau de bord de révision.', { cause: error });
  }
}

export async function getUserMistakesNotebook(userId: number) {
  try {
    await ensureCurriculumSeeded();

    const rows = await db
      .select({
        attemptId: quizAttempts.id,
        exerciseId: quizAttempts.exerciseId,
        chapterId: quizAttempts.chapterId,
        submittedAnswer: quizAttempts.submittedAnswer,
        isCorrect: quizAttempts.isCorrect,
        createdAt: quizAttempts.createdAt,
        exerciseType: exercises.exerciseType,
        prompt: exercises.prompt,
        hint: exercises.hint,
        optionsJson: exercises.optionsJson,
        explanation: exercises.explanation,
        chapterTitle: chapters.title,
        subject: chapters.subject,
        gradeLevel: chapters.gradeLevel,
      })
      .from(quizAttempts)
      .innerJoin(exercises, eq(quizAttempts.exerciseId, exercises.id))
      .innerJoin(chapters, eq(quizAttempts.chapterId, chapters.id))
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.createdAt))
      .limit(400);

    const byExercise = new Map<
      number,
      {
        exerciseId: number;
        chapterId: number;
        chapterTitle: string;
        subject: string;
        gradeLevel: string;
        exerciseType: 'quiz' | 'practice';
        prompt: string;
        hint: string;
        options: string[] | null;
        explanation: string;
        lastSubmittedAnswer: string;
        wrongCount: number;
        lastWrongAt: Date | null;
        lastCorrectAt: Date | null;
      }
    >();

    for (const row of rows) {
      let entry = byExercise.get(row.exerciseId);
      if (!entry) {
        entry = {
          exerciseId: row.exerciseId,
          chapterId: row.chapterId,
          chapterTitle: row.chapterTitle,
          subject: row.subject || 'mathematics',
          gradeLevel: row.gradeLevel,
          exerciseType: row.exerciseType === 'quiz' ? 'quiz' : 'practice',
          prompt: row.prompt,
          hint: row.hint,
          options: row.optionsJson ? (JSON.parse(row.optionsJson) as string[]) : null,
          explanation: row.explanation,
          lastSubmittedAnswer: row.submittedAnswer,
          wrongCount: 0,
          lastWrongAt: null,
          lastCorrectAt: null,
        };
        byExercise.set(row.exerciseId, entry);
      }

      if (!row.isCorrect) {
        entry.wrongCount += 1;
        if (!entry.lastWrongAt || row.createdAt.getTime() > entry.lastWrongAt.getTime()) {
          entry.lastWrongAt = row.createdAt;
          entry.lastSubmittedAnswer = row.submittedAnswer;
        }
      } else if (!entry.lastCorrectAt || row.createdAt.getTime() > entry.lastCorrectAt.getTime()) {
        entry.lastCorrectAt = row.createdAt;
      }
    }

    const unresolved: Array<{
      key: string;
      exerciseId: number;
      chapterId: number;
      chapterTitle: string;
      subject: string;
      gradeLevel: string;
      exerciseType: 'quiz' | 'practice';
      prompt: string;
      hint: string;
      options: string[] | null;
      explanation: string;
      lastSubmittedAnswer: string;
      wrongCount: number;
      lastWrongAt: string;
      resolved: boolean;
      source: 'exercise';
    }> = [];

    const resolved: typeof unresolved = [];

    for (const item of byExercise.values()) {
      if (item.wrongCount === 0 || !item.lastWrongAt) continue;
      const isResolved =
        item.lastCorrectAt !== null && item.lastCorrectAt.getTime() > item.lastWrongAt.getTime();
      const formatted = {
        key: `ex-${item.exerciseId}`,
        exerciseId: item.exerciseId,
        chapterId: item.chapterId,
        chapterTitle: item.chapterTitle,
        subject: item.subject,
        gradeLevel: item.gradeLevel,
        exerciseType: item.exerciseType,
        prompt: item.prompt,
        hint: item.hint,
        options: item.options,
        explanation: item.explanation,
        lastSubmittedAnswer: item.lastSubmittedAnswer,
        wrongCount: item.wrongCount,
        lastWrongAt: item.lastWrongAt.toISOString(),
        resolved: isResolved,
        source: 'exercise' as const,
      };
      if (isResolved) {
        resolved.push(formatted);
      } else {
        unresolved.push(formatted);
      }
    }

    unresolved.sort((a, b) => new Date(b.lastWrongAt).getTime() - new Date(a.lastWrongAt).getTime());
    resolved.sort((a, b) => new Date(b.lastWrongAt).getTime() - new Date(a.lastWrongAt).getTime());

    return {
      unresolved,
      resolved: resolved.slice(0, 30),
      stats: {
        totalTracked: unresolved.length + resolved.length,
        unresolvedCount: unresolved.length,
        resolvedCount: resolved.length,
      },
    };
  } catch (error) {
    console.error('Database error in getUserMistakesNotebook:', error);
    throw new Error('Impossible de charger le carnet d’erreurs.', { cause: error });
  }
}
