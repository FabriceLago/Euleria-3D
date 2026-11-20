import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  badges,
  chapters,
  chatMessages,
  exercises,
  quizAttempts,
  studyRooms,
  userBadges,
  userProgress,
  users,
} from './schema.ts';
import { ALL_SEED_BADGES, ALL_SEED_CHAPTERS, ALL_SEED_ROOMS } from './curriculumData.ts';
import { computeRealTimePrediction, evaluateExerciseAnswer } from '../services/predictionEngine.ts';

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
      throw new Error('Exercice introuvable.');
    }

    const chapterExercises = await db
      .select()
      .from(exercises)
      .where(eq(exercises.chapterId, exercise.chapterId));

    const isCorrect = evaluateExerciseAnswer(
      exercise.exerciseType,
      params.submittedAnswer,
      exercise.correctAnswer,
      exercise.numericTolerance ?? 0.05
    );

    const priorCorrectOnExercise = await db
      .select({ id: quizAttempts.id })
      .from(quizAttempts)
      .where(
        and(
          eq(quizAttempts.userId, params.userId),
          eq(quizAttempts.exerciseId, exercise.id),
          eq(quizAttempts.isCorrect, true)
        )
      )
      .limit(1);

    const alreadySolved = priorCorrectOnExercise.length > 0;
    const xpEarned = isCorrect ? (alreadySolved ? 5 : exercise.xpValue) : 0;

    // Enregistrement de la tentative
    await db.insert(quizAttempts).values({
      userId: params.userId,
      chapterId: exercise.chapterId,
      exerciseId: exercise.id,
      submittedAnswer: params.submittedAnswer,
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
      throw new Error('Salon introuvable.');
    }

    const cleanContent = params.content.trim().slice(0, 1000);
    if (!cleanContent) {
      throw new Error('Le message ne peut pas être vide.');
    }

    const [inserted] = await db
      .insert(chatMessages)
      .values({
        roomId: room.id,
        userId: params.userId,
        content: cleanContent,
        sharedChapterId: params.sharedChapterId ?? null,
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
