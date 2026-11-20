import 'dotenv/config';
import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import path from 'path';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { adminAuth } from './src/lib/firebase-admin.ts';
import {
  getLeaderboard,
  getOrCreateUser,
  updateUserPreferences,
} from './src/db/users.ts';
import {
  awardDynamicQuizXp,
  createChatMessage,
  getChapterExercisesForGenerator,
  getFullCurriculum,
  getStudyRoomsWithMessages,
  getUserDashboardData,
  recordExerciseAttempt,
} from './src/db/learning.ts';
import {
  evaluateDynamicQuestionAnswer,
  generateDynamicQuiz,
  sanitizeQuizQuestions,
  type GeneratedQuizQuestion,
  type QuizDifficulty,
  type QuizMode,
} from './src/services/dynamicQuizEngine.ts';
import type { ChapterItem } from './src/types/learning.ts';

const PORT = Number(process.env.PORT) || 3000;
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const RUNNING_UNDER_TSX = process.execArgv.some((arg) => arg.includes('tsx'));
const IS_PROD =
  process.env.NODE_ENV === 'production' ||
  (!RUNNING_UNDER_TSX && fs.existsSync(path.join(DIST_DIR, 'index.html')));

interface ConnectedClient {
  ws: WebSocket;
  userUid: string | null;
  displayName: string;
  gradeLevel: string;
  roomSlug: string;
}

const clients = new Set<ConnectedClient>();

function broadcastEvent(event: string, payload: unknown, filterRoomSlug?: string) {
  const serialized = JSON.stringify({ event, payload });
  for (const client of clients) {
    if (client.ws.readyState !== WebSocket.OPEN) continue;
    if (filterRoomSlug && client.roomSlug !== filterRoomSlug) continue;
    client.ws.send(serialized);
  }
}

function broadcastPresence() {
  const activeUsersMap = new Map<string, { displayName: string; gradeLevel: string; roomSlug: string }>();
  for (const client of clients) {
    if (client.userUid) {
      activeUsersMap.set(client.userUid, {
        displayName: client.displayName,
        gradeLevel: client.gradeLevel,
        roomSlug: client.roomSlug,
      });
    }
  }
  broadcastEvent('presence:update', {
    onlineCount: clients.size,
    authenticatedUsers: Array.from(activeUsersMap.values()),
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Support CORS pour permettre un frontend séparé (ex: Vercel) pointant vers ce backend Cloud Run
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Santé API
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Programme complet 6e -> Terminale (lecture publique depuis Cloud SQL)
  app.get('/api/curriculum', async (_req, res) => {
    try {
      const curriculum = await getFullCurriculum();
      res.json({ chapters: curriculum });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur serveur';
      res.status(500).json({ error: msg });
    }
  });

  // Classement temps réel (lecture publique depuis Cloud SQL)
  app.get('/api/leaderboard', async (_req, res) => {
    try {
      const rows = await getLeaderboard(25);
      res.json({ leaderboard: rows });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur serveur';
      res.status(500).json({ error: msg });
    }
  });

  // Salons d'entraide et historique des messages (authentifié ou lecture)
  app.get('/api/rooms', async (req, res) => {
    try {
      const roomSlug = typeof req.query.room === 'string' ? req.query.room : undefined;
      const data = await getStudyRoomsWithMessages(roomSlug);
      res.json(data);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur serveur';
      res.status(500).json({ error: msg });
    }
  });

  // Profil + progression + prédictions BKT + badges de l'élève authentifié
  app.get('/api/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Utilisateur non authentifié.' });
      }
      const user = await getOrCreateUser(
        req.user.uid,
        req.user.email || `${req.user.uid}@euleria.local`,
        req.user.name,
        req.user.picture
      );
      const dashboard = await getUserDashboardData(user.id);
      res.json({ user, ...dashboard });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur serveur';
      res.status(500).json({ error: msg });
    }
  });

  // Personnalisation de l'interface & niveau scolaire
  app.patch('/api/me/preferences', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Utilisateur non authentifié.' });
      }
      const allowedGrades = ['6e', '5e', '4e', '3e', '2nde', '1ere', 'terminale'];
      const allowedThemes = ['light', 'dark'];
      const allowedAccents = ['indigo', 'emerald', 'amber', 'sky'];
      const allowedDensities = ['comfortable', 'compact'];

      const body = req.body || {};
      const updates: Record<string, string | boolean> = {};

      if (typeof body.displayName === 'string' && body.displayName.trim().length >= 2) {
        updates.displayName = body.displayName.trim().slice(0, 40);
      }
      if (typeof body.gradeLevel === 'string' && allowedGrades.includes(body.gradeLevel)) {
        updates.gradeLevel = body.gradeLevel;
      }
      if (typeof body.themeMode === 'string' && allowedThemes.includes(body.themeMode)) {
        updates.themeMode = body.themeMode;
      }
      if (typeof body.accentColor === 'string' && allowedAccents.includes(body.accentColor)) {
        updates.accentColor = body.accentColor;
      }
      if (typeof body.layoutDensity === 'string' && allowedDensities.includes(body.layoutDensity)) {
        updates.layoutDensity = body.layoutDensity;
      }
      if (typeof body.show3DHints === 'boolean') {
        updates.show3DHints = body.show3DHints;
      }

      await getOrCreateUser(
        req.user.uid,
        req.user.email || `${req.user.uid}@euleria.local`,
        req.user.name,
        req.user.picture
      );
      const updated = await updateUserPreferences(req.user.uid, updates);
      res.json({ user: updated });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur serveur';
      res.status(500).json({ error: msg });
    }
  });

  // Soumission d'un quiz ou exercice pratique + calcul prédictif temps réel + diffusion WS
  app.post('/api/progress/attempt', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Utilisateur non authentifié.' });
      }
      const { exerciseId, submittedAnswer, responseTimeMs } = req.body || {};
      if (!exerciseId || typeof submittedAnswer !== 'string') {
        return res.status(400).json({ error: 'Paramètres manquants pour la validation.' });
      }

      const user = await getOrCreateUser(
        req.user.uid,
        req.user.email || `${req.user.uid}@euleria.local`,
        req.user.name,
        req.user.picture
      );

      const outcome = await recordExerciseAttempt({
        userId: user.id,
        exerciseId: Number(exerciseId),
        submittedAnswer,
        responseTimeMs: Number(responseTimeMs) || 6000,
      });

      // Mise à jour temps réel du classement via WebSocket
      const leaderboard = await getLeaderboard(25);
      broadcastEvent('leaderboard:updated', { leaderboard });

      res.json(outcome);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur serveur';
      res.status(500).json({ error: msg });
    }
  });

  // Sessions serveur pour le générateur de quiz dynamiques (évite toute falsification de réponses/XP)
  interface DynamicQuizSession {
    questions: GeneratedQuizQuestion[];
    answeredIds: Set<string>;
    currentStreak: number;
    totalCorrect: number;
    createdAt: number;
  }
  const dynamicQuizSessions = new Map<string, DynamicQuizSession>();

  function pruneOldQuizSessions() {
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    for (const [id, sess] of dynamicQuizSessions.entries()) {
      if (sess.createdAt < cutoff) dynamicQuizSessions.delete(id);
    }
    if (dynamicQuizSessions.size > 500) {
      const oldestKey = dynamicQuizSessions.keys().next().value;
      if (oldestKey) dynamicQuizSessions.delete(oldestKey);
    }
  }

  // Génération d'un quiz dynamique à partir des chapitres sélectionnés
  app.post('/api/quiz/generate', async (req, res) => {
    try {
      const { chapterIds, questionCount, difficulty, mode } = req.body || {};
      if (!Array.isArray(chapterIds) || chapterIds.length === 0) {
        return res.status(400).json({ error: 'Sélectionnez au moins un chapitre pour générer le quiz.' });
      }

      const cleanIds = Array.from(
        new Set(chapterIds.map((id: unknown) => Number(id)).filter((n) => Number.isInteger(n) && n > 0))
      ).slice(0, 25);

      if (cleanIds.length === 0) {
        return res.status(400).json({ error: 'Identifiants de chapitres invalides.' });
      }

      const validDifficulty: QuizDifficulty =
        difficulty === 'decouverte' || difficulty === 'defi' ? difficulty : 'standard';
      const validMode: QuizMode =
        mode === 'qcm' || mode === 'numerique' ? mode : 'mixte';
      const validCount = Math.max(3, Math.min(15, Number(questionCount) || 6));

      const allChapters = (await getFullCurriculum()) as ChapterItem[];
      const idSet = new Set(cleanIds);
      const selectedChapters = allChapters.filter((ch) => idSet.has(ch.id));

      if (selectedChapters.length === 0) {
        return res.status(404).json({ error: 'Aucun chapitre correspondant trouvé en base.' });
      }

      const exercisesMap = await getChapterExercisesForGenerator(cleanIds);
      const questions = generateDynamicQuiz(selectedChapters, allChapters, exercisesMap, {
        questionCount: validCount,
        difficulty: validDifficulty,
        mode: validMode,
      });

      pruneOldQuizSessions();
      const sessionId = crypto.randomUUID();
      dynamicQuizSessions.set(sessionId, {
        questions,
        answeredIds: new Set(),
        currentStreak: 0,
        totalCorrect: 0,
        createdAt: Date.now(),
      });

      res.json({
        sessionId,
        difficulty: validDifficulty,
        mode: validMode,
        chapterCount: selectedChapters.length,
        questions: sanitizeQuizQuestions(questions),
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur lors de la génération du quiz.';
      res.status(500).json({ error: msg });
    }
  });

  // Validation immédiate d'une réponse du quiz dynamique + calcul automatique d'XP + synchro Cloud SQL
  app.post('/api/quiz/answer', async (req, res) => {
    try {
      const { sessionId, questionId, submittedAnswer, responseTimeMs } = req.body || {};
      if (
        typeof sessionId !== 'string' ||
        typeof questionId !== 'string' ||
        typeof submittedAnswer !== 'string'
      ) {
        return res.status(400).json({ error: 'Paramètres de réponse manquants.' });
      }

      const session = dynamicQuizSessions.get(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session de quiz expirée. Générez un nouveau quiz.' });
      }

      const question = session.questions.find((q) => q.id === questionId);
      if (!question) {
        return res.status(404).json({ error: 'Question introuvable dans cette session.' });
      }

      if (session.answeredIds.has(questionId)) {
        return res.status(409).json({ error: 'Cette question a déjà été validée.' });
      }

      const isFinalQuestion = session.answeredIds.size + 1 >= session.questions.length;
      const evaluation = evaluateDynamicQuestionAnswer({
        question,
        submittedAnswer,
        responseTimeMs: Math.max(500, Math.min(Number(responseTimeMs) || 10000, 300000)),
        currentStreak: session.currentStreak,
        isFinalQuestion,
        totalCorrectSoFar: session.totalCorrect,
        totalQuestions: session.questions.length,
      });

      session.answeredIds.add(questionId);
      session.currentStreak = evaluation.nextStreak;
      if (evaluation.isCorrect) {
        session.totalCorrect += 1;
      }

      let persisted = false;
      let userXp: number | null = null;
      let newlyUnlockedBadges: Array<{
        id: number;
        slug: string;
        title: string;
        description: string;
        iconName: string;
        xpThreshold: number;
        conditionType: string;
      }> = [];

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split('Bearer ')[1];
          const decoded = await adminAuth.verifyIdToken(token);
          const dbUser = await getOrCreateUser(
            decoded.uid,
            decoded.email || `${decoded.uid}@euleria.local`,
            decoded.name,
            decoded.picture
          );
          const awarded = await awardDynamicQuizXp(dbUser.id, evaluation.xpBreakdown.totalXp);
          persisted = true;
          userXp = awarded.userXp;
          newlyUnlockedBadges = awarded.newlyUnlockedBadges;

          if (evaluation.xpBreakdown.totalXp > 0) {
            const leaderboard = await getLeaderboard(25);
            broadcastEvent('leaderboard:updated', { leaderboard });
          }
        } catch {
          // Jeton absent/expiré : on renvoie tout de même la rétroaction immédiate sans bloquer
        }
      }

      res.json({
        isCorrect: evaluation.isCorrect,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        xpBreakdown: evaluation.xpBreakdown,
        currentStreak: session.currentStreak,
        totalCorrect: session.totalCorrect,
        answeredCount: session.answeredIds.size,
        totalQuestions: session.questions.length,
        persisted,
        userXp,
        newlyUnlockedBadges,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur serveur';
      res.status(500).json({ error: msg });
    }
  });

  // Envoi d'un message collaboratif dans un salon d'entraide
  app.post('/api/rooms/:slug/messages', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Utilisateur non authentifié.' });
      }
      const roomSlug = req.params.slug;
      const { content, sharedChapterId } = req.body || {};
      if (typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ error: 'Le message ne peut pas être vide.' });
      }

      const user = await getOrCreateUser(
        req.user.uid,
        req.user.email || `${req.user.uid}@euleria.local`,
        req.user.name,
        req.user.picture
      );

      const result = await createChatMessage({
        roomSlug,
        userId: user.id,
        content,
        sharedChapterId: sharedChapterId ? Number(sharedChapterId) : null,
      });

      broadcastEvent('chat:message', result.message, roomSlug);
      res.status(201).json(result);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur serveur';
      res.status(500).json({ error: msg });
    }
  });

  const server = http.createServer(app);

  // Serveur WebSocket temps réel sur le même port 3000 (/ws)
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    const client: ConnectedClient = {
      ws,
      userUid: null,
      displayName: 'Visiteur',
      gradeLevel: '6e',
      roomSlug: 'entraide-college',
    };
    clients.add(client);
    broadcastPresence();

    ws.on('message', async (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === 'auth' && typeof data.token === 'string') {
          try {
            const decoded = await adminAuth.verifyIdToken(data.token);
            const dbUser = await getOrCreateUser(
              decoded.uid,
              decoded.email || `${decoded.uid}@euleria.local`,
              decoded.name,
              decoded.picture
            );
            client.userUid = dbUser.uid;
            client.displayName = dbUser.displayName;
            client.gradeLevel = dbUser.gradeLevel;
            broadcastPresence();
          } catch (authErr: unknown) {
            const code =
              typeof authErr === 'object' && authErr !== null && 'code' in authErr
                ? String((authErr as { code?: unknown }).code)
                : '';

            client.userUid = null;
            if (code === 'auth/id-token-expired') {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ event: 'auth:expired' }));
              }
              return;
            }
            if (
              code === 'auth/argument-error' ||
              code === 'auth/invalid-id-token' ||
              code === 'auth/id-token-revoked'
            ) {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ event: 'auth:invalid' }));
              }
              return;
            }
            console.error('WebSocket auth error:', authErr);
          }
        } else if (data.type === 'room:join' && typeof data.roomSlug === 'string') {
          client.roomSlug = data.roomSlug;
          broadcastPresence();
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });

    ws.on('close', () => {
      clients.delete(client);
      broadcastPresence();
    });
  });

  // Intégration Vite (dev) ou fichiers statiques buildés (production)
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(DIST_DIR));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Euleria 3D server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
