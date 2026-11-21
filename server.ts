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
  assertValidChapterCardKey,
  awardDynamicQuizXp,
  createChatMessage,
  getChapterExercisesForGenerator,
  getChapterFlashcardsAndSheet,
  getFullCurriculum,
  getStudyRoomsWithMessages,
  getUserDashboardData,
  getUserExamHistory,
  getUserMistakesNotebook,
  getUserStudyPlan,
  recordExamSession,
  recordExerciseAttempt,
  recordFlashcardReview,
  ValidationError,
} from './src/db/learning.ts';
import {
  evaluateDynamicQuestionAnswer,
  generateDynamicQuiz,
  sanitizeQuizQuestions,
  type GeneratedQuizQuestion,
  type QuizDifficulty,
  type QuizMode,
} from './src/services/dynamicQuizEngine.ts';
import { evaluateExerciseAnswer } from './src/services/predictionEngine.ts';
import {
  buildMockExamQuestions,
  getExamPresetBySlug,
  gradeMockExam,
  MOCK_EXAM_PRESETS,
  sanitizeExamQuestions,
  type GeneratedExamQuestion,
  type MockExamPreset,
} from './src/services/mockExamEngine.ts';
import {
  computeSm2NextState,
  type FlashcardRating,
} from './src/services/flashcardEngine.ts';
import type { ChapterItem, GradeLevel, SubjectId } from './src/types/learning.ts';

const PORT = Number(process.env.PORT) || 3000;
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const RUNNING_UNDER_TSX = process.execArgv.some((arg) => arg.includes('tsx'));
const IS_PROD =
  process.env.NODE_ENV === 'production' ||
  (!RUNNING_UNDER_TSX && fs.existsSync(path.join(DIST_DIR, 'index.html')));

interface ConnectedClient {
  clientId: string;
  ws: WebSocket;
  userUid: string | null;
  dbUserId: number | null;
  displayName: string;
  gradeLevel: string;
  roomSlug: string;
  duelCode: string | null;
}

interface DuelParticipantInternal {
  client: ConnectedClient;
  score: number;
  correctCount: number;
  answeredCurrent: boolean;
  xpAwarded: number;
}

interface DuelRoomInternal {
  code: string;
  hostClientId: string;
  subject: SubjectId | 'all';
  gradeLevel: GradeLevel;
  status: 'waiting' | 'active' | 'finished';
  questions: GeneratedQuizQuestion[];
  currentIndex: number;
  questionTimeLimitMs: number;
  questionStartedAt: number | null;
  participants: Map<string, DuelParticipantInternal>;
  lastRoundReveal: {
    questionId: string;
    prompt: string;
    correctAnswer: string;
    explanation: string;
  } | null;
  roundTimer: ReturnType<typeof setTimeout> | null;
  createdAt: number;
}

const clients = new Set<ConnectedClient>();
const duelRooms = new Map<string, DuelRoomInternal>();

function sendToClient(client: ConnectedClient, event: string, payload: unknown) {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify({ event, payload }));
  }
}

function getDuelLobbyPayload() {
  return Array.from(duelRooms.values())
    .filter((room) => room.status !== 'finished' && room.participants.size > 0)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 15)
    .map((room) => {
      const host = room.participants.get(room.hostClientId);
      return {
        code: room.code,
        hostName: host?.client.displayName || 'Hôte',
        subject: room.subject,
        gradeLevel: room.gradeLevel,
        status: room.status,
        playerCount: room.participants.size,
        maxPlayers: 6,
        questionCount: room.questions.length,
      };
    });
}

function broadcastDuelLobby() {
  broadcastEvent('duel:lobby', { rooms: getDuelLobbyPayload() });
}

function broadcastDuelState(room: DuelRoomInternal) {
  const activeQ =
    room.status === 'active' && room.currentIndex < room.questions.length
      ? room.questions[room.currentIndex]
      : null;

  const participants = Array.from(room.participants.values())
    .map((p) => ({
      clientId: p.client.clientId,
      displayName: p.client.displayName,
      gradeLevel: p.client.gradeLevel,
      score: p.score,
      correctCount: p.correctCount,
      answeredCurrent: p.answeredCurrent,
      isHost: p.client.clientId === room.hostClientId,
      xpAwarded: p.xpAwarded,
    }))
    .sort((a, b) => b.score - a.score);

  for (const p of room.participants.values()) {
    sendToClient(p.client, 'duel:state', {
      code: room.code,
      subject: room.subject,
      gradeLevel: room.gradeLevel,
      status: room.status,
      currentIndex: room.currentIndex,
      totalQuestions: room.questions.length,
      questionTimeLimitMs: room.questionTimeLimitMs,
      questionStartedAt: room.questionStartedAt,
      currentQuestion: activeQ
        ? {
            id: activeQ.id,
            chapterTitle: activeQ.chapterTitle,
            gradeLevel: activeQ.gradeLevel,
            exerciseType: activeQ.exerciseType,
            prompt: activeQ.prompt,
            options: activeQ.options,
          }
        : null,
      participants,
      myClientId: p.client.clientId,
      lastRoundReveal: room.lastRoundReveal,
    });
  }
}

async function finishDuelRoom(room: DuelRoomInternal) {
  if (room.roundTimer) {
    clearTimeout(room.roundTimer);
    room.roundTimer = null;
  }
  room.status = 'finished';
  room.questionStartedAt = null;

  const ranked = Array.from(room.participants.values()).sort((a, b) => b.score - a.score);
  const topScore = ranked[0]?.score ?? 0;
  let anyXpAwarded = false;

  for (const p of ranked) {
    if (p.correctCount > 0 && p.client.dbUserId) {
      const reward = p.score === topScore && topScore > 0 ? 30 : 15;
      try {
        await awardDynamicQuizXp(p.client.dbUserId, reward);
        p.xpAwarded = reward;
        anyXpAwarded = true;
      } catch {
        // Non-blocking XP reward
      }
    }
  }

  broadcastDuelState(room);
  broadcastDuelLobby();

  if (anyXpAwarded) {
    try {
      const leaderboard = await getLeaderboard(25);
      broadcastEvent('leaderboard:updated', { leaderboard });
    } catch {
      // Ignore transient broadcast error
    }
  }
}

function advanceDuelRound(room: DuelRoomInternal) {
  if (room.roundTimer) {
    clearTimeout(room.roundTimer);
    room.roundTimer = null;
  }
  if (room.status !== 'active') return;

  const prevQ = room.questions[room.currentIndex];
  if (prevQ) {
    room.lastRoundReveal = {
      questionId: prevQ.id,
      prompt: prevQ.prompt,
      correctAnswer: prevQ.correctAnswer,
      explanation: prevQ.explanation,
    };
  }

  const nextIdx = room.currentIndex + 1;
  if (nextIdx >= room.questions.length) {
    void finishDuelRoom(room);
    return;
  }

  room.currentIndex = nextIdx;
  room.questionStartedAt = Date.now();
  for (const p of room.participants.values()) {
    p.answeredCurrent = false;
  }

  broadcastDuelState(room);

  room.roundTimer = setTimeout(() => {
    advanceDuelRound(room);
  }, room.questionTimeLimitMs);
}

function removeClientFromDuel(client: ConnectedClient) {
  if (!client.duelCode) return;
  const code = client.duelCode;
  client.duelCode = null;
  const room = duelRooms.get(code);
  if (!room) return;

  room.participants.delete(client.clientId);
  if (room.participants.size === 0) {
    if (room.roundTimer) clearTimeout(room.roundTimer);
    duelRooms.delete(code);
    broadcastDuelLobby();
    return;
  }

  if (room.hostClientId === client.clientId) {
    const nextHost = room.participants.values().next().value;
    if (nextHost) room.hostClientId = nextHost.client.clientId;
  }

  broadcastDuelState(room);
  broadcastDuelLobby();
}

function pruneStaleDuels() {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [code, room] of duelRooms.entries()) {
    if (room.createdAt < cutoff || room.participants.size === 0) {
      if (room.roundTimer) clearTimeout(room.roundTimer);
      duelRooms.delete(code);
    }
  }
}

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

const ROOM_SLUG_REGEX = /^[a-z0-9-]{2,64}$/;
const CARD_KEY_REGEX = /^(concept|formula|ex-\d{1,2})$/;

function stripControlChars(input: string): string {
  return Array.from(input)
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('');
}

const configuredOrigins = new Set<string>(
  [process.env.APP_URL || '', ...(process.env.ALLOWED_ORIGINS || '').split(',')]
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean)
);

function isOriginAllowed(origin: string, req: express.Request): boolean {
  if (configuredOrigins.has(origin)) return true;
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const rawHost = req.headers['x-forwarded-host'] || req.headers.host;
    const reqHost = Array.isArray(rawHost) ? rawHost[0] : rawHost;
    if (reqHost && parsed.host === reqHost) {
      return true;
    }
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return true;
    }
    if (
      parsed.protocol === 'https:' &&
      (parsed.hostname.endsWith('.run.app') || parsed.hostname === 'run.app')
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}): express.RequestHandler {
  const hits = new Map<string, number[]>();
  let opCount = 0;

  return (req, res, next) => {
    const now = Date.now();
    const cutoff = now - options.windowMs;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${options.keyPrefix}:${ip}`;

    const timestamps = (hits.get(key) || []).filter((ts) => ts > cutoff);
    if (timestamps.length >= options.maxRequests) {
      const oldest = timestamps[0] || now;
      const retryAfterSec = Math.max(1, Math.ceil((oldest + options.windowMs - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        error: 'Trop de requêtes. Veuillez patienter quelques instants.',
      });
    }

    timestamps.push(now);
    hits.set(key, timestamps);

    opCount += 1;
    if (opCount % 200 === 0 || hits.size > 2000) {
      for (const [k, list] of hits.entries()) {
        const fresh = list.filter((ts) => ts > cutoff);
        if (fresh.length === 0) hits.delete(k);
        else hits.set(k, fresh);
      }
    }

    next();
  };
}

async function tryVerifyOptionalAuth(req: express.Request): Promise<{
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
} | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token || token.length > 4096) {
    return null;
  }
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    };
  } catch {
    return null;
  }
}

function sendRouteError(res: express.Response, error: unknown, fallbackMessage: string) {
  if (error instanceof ValidationError) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  const msg = error instanceof Error ? error.message : fallbackMessage;
  return res.status(500).json({ error: msg });
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // En-têtes de sécurité HTTP (sans X-Frame-Options pour préserver l'aperçu en iframe)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.use(express.json({ limit: '64kb' }));

  // Interception propre des corps JSON malformés ou trop volumineux (évite toute trace HTML)
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (err && typeof err === 'object') {
        const status =
          'status' in err && typeof (err as { status?: unknown }).status === 'number'
            ? (err as { status: number }).status
            : 'statusCode' in err && typeof (err as { statusCode?: unknown }).statusCode === 'number'
              ? (err as { statusCode: number }).statusCode
              : null;
        if (status === 413) {
          return res.status(413).json({ error: 'Requête trop volumineuse.' });
        }
        if (err instanceof SyntaxError && status === 400) {
          return res.status(400).json({ error: 'Corps JSON invalide.' });
        }
      }
      next(err);
    }
  );

  // Politique CORS stricte par liste blanche d'origines autorisées
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Vary', 'Origin');
      if (isOriginAllowed(origin, req)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
          return res.sendStatus(204);
        }
      } else if (req.method === 'OPTIONS') {
        return res.status(403).json({ error: 'Origine non autorisée.' });
      }
    } else if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  const preferencesLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 20, keyPrefix: 'prefs' });
  const attemptLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 40, keyPrefix: 'attempt' });
  const quizGenerateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 20, keyPrefix: 'quiz-gen' });
  const quizAnswerLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 60, keyPrefix: 'quiz-ans' });
  const examStartLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 12, keyPrefix: 'exam-start' });
  const examSubmitLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 12, keyPrefix: 'exam-sub' });
  const flashcardLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 60, keyPrefix: 'fc-rev' });
  const chatMessageLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 15, keyPrefix: 'chat-msg' });

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
      const rawRoom = typeof req.query.room === 'string' ? req.query.room.trim() : undefined;
      if (rawRoom && !ROOM_SLUG_REGEX.test(rawRoom)) {
        return res.status(400).json({ error: 'Identifiant de salon invalide.' });
      }
      const data = await getStudyRoomsWithMessages(rawRoom);
      res.json(data);
    } catch (error: unknown) {
      sendRouteError(res, error, 'Erreur serveur');
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
  app.patch('/api/me/preferences', preferencesLimiter, requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Utilisateur non authentifié.' });
      }
      const allowedGrades = ['6e', '5e', '4e', '3e', '2nde', '1ere', 'terminale'];
      const allowedThemes = ['light', 'dark'];
      const allowedAccents = ['indigo', 'emerald', 'amber', 'sky'];
      const allowedDensities = ['comfortable', 'compact'];

      const body = req.body || {};
      const updates: Record<string, string | boolean | number> = {};

      if (typeof body.displayName === 'string') {
        const cleanName = stripControlChars(body.displayName).trim().slice(0, 40);
        if (cleanName.length >= 2) {
          updates.displayName = cleanName;
        }
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
      if (typeof body.weeklyXpGoal === 'number' && Number.isFinite(body.weeklyXpGoal)) {
        updates.weeklyXpGoal = Math.max(100, Math.min(5000, Math.round(body.weeklyXpGoal)));
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'Aucune préférence valide fournie.' });
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
      sendRouteError(res, error, 'Erreur serveur');
    }
  });

  // Soumission d'un quiz ou exercice pratique + calcul prédictif temps réel + diffusion WS
  app.post('/api/progress/attempt', attemptLimiter, requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Utilisateur non authentifié.' });
      }
      const { exerciseId, submittedAnswer, responseTimeMs } = req.body || {};
      const parsedExerciseId = Number(exerciseId);
      if (
        !Number.isInteger(parsedExerciseId) ||
        parsedExerciseId <= 0 ||
        typeof submittedAnswer !== 'string' ||
        !submittedAnswer.trim() ||
        submittedAnswer.length > 256
      ) {
        return res.status(400).json({ error: 'Paramètres invalides pour la validation.' });
      }

      const user = await getOrCreateUser(
        req.user.uid,
        req.user.email || `${req.user.uid}@euleria.local`,
        req.user.name,
        req.user.picture
      );

      const outcome = await recordExerciseAttempt({
        userId: user.id,
        exerciseId: parsedExerciseId,
        submittedAnswer: submittedAnswer.trim(),
        responseTimeMs: Number(responseTimeMs) || 6000,
      });

      // Mise à jour temps réel du classement via WebSocket
      const leaderboard = await getLeaderboard(25);
      broadcastEvent('leaderboard:updated', { leaderboard });

      res.json(outcome);
    } catch (error: unknown) {
      sendRouteError(res, error, 'Erreur serveur');
    }
  });

  // Sessions serveur pour le générateur de quiz dynamiques (évite toute falsification de réponses/XP)
  interface DynamicQuizSession {
    ownerUid: string | null;
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
  app.post('/api/quiz/generate', quizGenerateLimiter, async (req, res) => {
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

      const authUser = await tryVerifyOptionalAuth(req);
      pruneOldQuizSessions();
      const sessionId = crypto.randomUUID();
      dynamicQuizSessions.set(sessionId, {
        ownerUid: authUser?.uid ?? null,
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
      sendRouteError(res, error, 'Erreur lors de la génération du quiz.');
    }
  });

  // Validation immédiate d'une réponse du quiz dynamique + calcul automatique d'XP + synchro Cloud SQL
  app.post('/api/quiz/answer', quizAnswerLimiter, async (req, res) => {
    try {
      const { sessionId, questionId, submittedAnswer, responseTimeMs } = req.body || {};
      if (
        typeof sessionId !== 'string' ||
        typeof questionId !== 'string' ||
        typeof submittedAnswer !== 'string' ||
        submittedAnswer.length > 256
      ) {
        return res.status(400).json({ error: 'Paramètres de réponse invalides.' });
      }

      const session = dynamicQuizSessions.get(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session de quiz expirée. Générez un nouveau quiz.' });
      }

      const authUser = await tryVerifyOptionalAuth(req);
      if (session.ownerUid && (!authUser || authUser.uid !== session.ownerUid)) {
        return res.status(403).json({ error: 'Cette session de quiz appartient à un autre élève.' });
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
        submittedAnswer: submittedAnswer.trim(),
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

      if (authUser) {
        const dbUser = await getOrCreateUser(
          authUser.uid,
          authUser.email || `${authUser.uid}@euleria.local`,
          authUser.name,
          authUser.picture
        );
        const awarded = await awardDynamicQuizXp(dbUser.id, evaluation.xpBreakdown.totalXp);
        persisted = true;
        userXp = awarded.userXp;
        newlyUnlockedBadges = awarded.newlyUnlockedBadges;

        if (evaluation.xpBreakdown.totalXp > 0) {
          const leaderboard = await getLeaderboard(25);
          broadcastEvent('leaderboard:updated', { leaderboard });
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
      sendRouteError(res, error, 'Erreur serveur');
    }
  });

  // Sessions d'examens blancs (Brevet / Bac / Bilans) en mémoire côté serveur (clés de réponse protégées)
  const mockExamSessions = new Map<
    string,
    {
      ownerUid: string | null;
      preset: MockExamPreset;
      gradeLabel: string;
      questions: GeneratedExamQuestion[];
      startedAt: number;
      submitted: boolean;
    }
  >();

  function pruneOldExamSessions() {
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    for (const [id, sess] of mockExamSessions.entries()) {
      if (sess.startedAt < cutoff) mockExamSessions.delete(id);
    }
    if (mockExamSessions.size > 300) {
      const oldestKey = mockExamSessions.keys().next().value;
      if (oldestKey) mockExamSessions.delete(oldestKey);
    }
  }

  // Démarrer un examen blanc chronométré multi-matières
  app.post('/api/exams/start', examStartLimiter, async (req, res) => {
    try {
      const { examSlug, gradeLevel } = req.body || {};
      if (typeof examSlug !== 'string') {
        return res.status(400).json({ error: 'Identifiant d’épreuve manquant.' });
      }
      const preset = getExamPresetBySlug(examSlug);
      if (!preset) {
        return res.status(404).json({
          error: 'Épreuve introuvable.',
          availablePresets: MOCK_EXAM_PRESETS.map((p) => p.slug),
        });
      }

      const validGrades: GradeLevel[] = ['6e', '5e', '4e', '3e', '2nde', '1ere', 'terminale'];
      const requestedGrade =
        typeof gradeLevel === 'string' && validGrades.includes(gradeLevel as GradeLevel)
          ? (gradeLevel as GradeLevel)
          : undefined;

      const allChapters = (await getFullCurriculum()) as ChapterItem[];
      const relevantChapterIds = allChapters
        .filter((ch) => preset.subjects.includes((ch.subject || 'mathematics') as any))
        .map((ch) => ch.id);
      const exercisesMap = await getChapterExercisesForGenerator(relevantChapterIds);

      const { questions, gradeLabel } = buildMockExamQuestions({
        preset,
        allChapters,
        exercisesMap,
        requestedGrade,
      });

      if (questions.length === 0) {
        return res.status(500).json({ error: 'Impossible de composer le sujet d’examen.' });
      }

      const authUser = await tryVerifyOptionalAuth(req);
      pruneOldExamSessions();
      const examSessionId = crypto.randomUUID();
      mockExamSessions.set(examSessionId, {
        ownerUid: authUser?.uid ?? null,
        preset,
        gradeLabel,
        questions,
        startedAt: Date.now(),
        submitted: false,
      });

      res.json({
        examSessionId,
        exam: {
          slug: preset.slug,
          title: preset.title,
          shortLabel: preset.shortLabel,
          gradeLabel,
          timeLimitSec: preset.timeLimitSec,
          questionCount: questions.length,
          subjects: preset.subjects,
        },
        questions: sanitizeExamQuestions(questions),
      });
    } catch (error: unknown) {
      sendRouteError(res, error, 'Erreur lors de la création de l’examen blanc.');
    }
  });

  // Soumettre la copie d'examen blanc, corriger sur /20, attribuer la Mention et enregistrer en base
  app.post('/api/exams/submit', examSubmitLimiter, async (req, res) => {
    try {
      const { examSessionId, answers, elapsedSeconds } = req.body || {};
      if (
        typeof examSessionId !== 'string' ||
        typeof answers !== 'object' ||
        answers === null ||
        Array.isArray(answers)
      ) {
        return res.status(400).json({ error: 'Copie d’examen incomplète.' });
      }

      const session = mockExamSessions.get(examSessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session d’examen expirée. Relancez une épreuve.' });
      }
      if (session.submitted) {
        return res.status(409).json({ error: 'Cette copie d’examen a déjà été corrigée.' });
      }

      const authUser = await tryVerifyOptionalAuth(req);
      if (session.ownerUid && (!authUser || authUser.uid !== session.ownerUid)) {
        return res.status(403).json({ error: 'Cette session d’examen appartient à un autre élève.' });
      }

      session.submitted = true;

      const serverElapsed = Math.max(1, Math.round((Date.now() - session.startedAt) / 1000));
      const clientElapsed = Number(elapsedSeconds);
      const durationSeconds =
        Number.isFinite(clientElapsed) && clientElapsed > 0
          ? Math.min(Math.round(clientElapsed), session.preset.timeLimitSec)
          : Math.min(serverElapsed, session.preset.timeLimitSec);

      const validQuestionIds = new Set(session.questions.map((q) => q.id));
      const safeAnswers: Record<string, string> = {};
      for (const [k, v] of Object.entries(answers as Record<string, unknown>)) {
        if (validQuestionIds.has(k) && typeof v === 'string') {
          safeAnswers[k] = v.trim().slice(0, 256);
        }
      }

      const report = gradeMockExam({
        preset: session.preset,
        gradeLabel: session.gradeLabel,
        questions: session.questions,
        answers: safeAnswers,
        durationSeconds,
      });

      let persisted = false;
      let savedExamId: number | null = null;
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

      if (authUser) {
        const dbUser = await getOrCreateUser(
          authUser.uid,
          authUser.email || `${authUser.uid}@euleria.local`,
          authUser.name,
          authUser.picture
        );
        const saved = await recordExamSession({
          userId: dbUser.id,
          examSlug: report.examSlug,
          examTitle: report.examTitle,
          gradeLabel: report.gradeLabel,
          scoreOn20: report.scoreOn20,
          correctCount: report.correctCount,
          totalQuestions: report.totalQuestions,
          mention: report.mention,
          durationSeconds: report.durationSeconds,
          xpAwarded: report.xpAwarded,
          subjectBreakdown: report.subjectBreakdown,
        });
        persisted = true;
        savedExamId = saved.sessionId;
        userXp = saved.userXp;
        newlyUnlockedBadges = saved.newlyUnlockedBadges;

        if (report.xpAwarded > 0) {
          const leaderboard = await getLeaderboard(25);
          broadcastEvent('leaderboard:updated', { leaderboard });
        }
      }

      res.json({
        ...report,
        persisted,
        savedExamId,
        userXp,
        newlyUnlockedBadges,
      });
    } catch (error: unknown) {
      sendRouteError(res, error, 'Erreur lors de la correction de la copie.');
    }
  });

  // Historique des examens blancs de l'élève connecté
  app.get('/api/exams/history', requireAuth, async (req: AuthRequest, res) => {
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
      const data = await getUserExamHistory(user.id, 20);
      res.json(data);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur serveur';
      res.status(500).json({ error: msg });
    }
  });

  // Tableau de bord de révision personnalisé (objectifs hebdo, SM-2 à revoir, chapitres prioritaires)
  app.get('/api/me/study-plan', requireAuth, async (req: AuthRequest, res) => {
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
      const plan = await getUserStudyPlan(user.id);
      res.json(plan);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur serveur';
      res.status(500).json({ error: msg });
    }
  });

  // Carnet d'erreurs intelligent ("Mes pièges à éviter")
  app.get('/api/me/mistakes', requireAuth, async (req: AuthRequest, res) => {
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
      const notebook = await getUserMistakesNotebook(user.id);
      res.json(notebook);
    } catch (error: unknown) {
      sendRouteError(res, error, 'Impossible de charger le carnet d’erreurs.');
    }
  });

  // Fiche de révision & Flashcards SM-2 d'un chapitre (avec état personnel si connecté)
  app.get('/api/chapters/:id/flashcards', async (req, res) => {
    try {
      const chapterId = Number(req.params.id);
      if (!Number.isInteger(chapterId) || chapterId <= 0) {
        return res.status(400).json({ error: 'Identifiant de chapitre invalide.' });
      }

      let dbUserId: number | null = null;
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
          dbUserId = dbUser.id;
        } catch {
          // Mode invité si jeton absent ou expiré
        }
      }

      const payload = await getChapterFlashcardsAndSheet(chapterId, dbUserId);
      if (!payload) {
        return res.status(404).json({ error: 'Chapitre introuvable.' });
      }
      res.json(payload);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erreur serveur';
      res.status(500).json({ error: msg });
    }
  });

  // Enregistrement d'une révision SM-2 de flashcard (+5 XP anti-farm et badge Mémoire durable)
  app.post('/api/chapters/:id/flashcards/review', flashcardLimiter, async (req, res) => {
    try {
      const chapterId = Number(req.params.id);
      if (!Number.isInteger(chapterId) || chapterId <= 0) {
        return res.status(400).json({ error: 'Identifiant de chapitre invalide.' });
      }

      const { cardKey, rating, currentState } = req.body || {};
      const validRatings: FlashcardRating[] = ['again', 'hard', 'good', 'easy'];
      const cleanCardKey = typeof cardKey === 'string' ? cardKey.trim() : '';
      if (
        !CARD_KEY_REGEX.test(cleanCardKey) ||
        !validRatings.includes(rating)
      ) {
        return res.status(400).json({ error: 'Paramètres de révision invalides.' });
      }

      await assertValidChapterCardKey(chapterId, cleanCardKey);

      const authUser = await tryVerifyOptionalAuth(req);
      if (authUser) {
        const dbUser = await getOrCreateUser(
          authUser.uid,
          authUser.email || `${authUser.uid}@euleria.local`,
          authUser.name,
          authUser.picture
        );

        const saved = await recordFlashcardReview({
          userId: dbUser.id,
          chapterId,
          cardKey: cleanCardKey,
          rating: rating as FlashcardRating,
        });

        if (saved.xpEarned > 0) {
          const leaderboard = await getLeaderboard(25);
          broadcastEvent('leaderboard:updated', { leaderboard });
        }

        return res.json({
          ...saved,
          persisted: true,
        });
      }

      // Mode exploration sans compte : calcul SM-2 temps réel sans persistance
      const next = computeSm2NextState(
        {
          easeFactor: Number(currentState?.easeFactor) || 2.5,
          intervalDays: Number(currentState?.intervalDays) || 0,
          repetitions: Number(currentState?.repetitions) || 0,
        },
        rating as FlashcardRating
      );

      return res.json({
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
        xpEarned: 0,
        userXp: null,
        newlyUnlockedBadges: [],
        persisted: false,
      });
    } catch (error: unknown) {
      sendRouteError(res, error, 'Erreur serveur');
    }
  });

  // Envoi d'un message collaboratif dans un salon d'entraide
  app.post('/api/rooms/:slug/messages', chatMessageLimiter, requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Utilisateur non authentifié.' });
      }
      const roomSlug = typeof req.params.slug === 'string' ? req.params.slug.trim() : '';
      if (!ROOM_SLUG_REGEX.test(roomSlug)) {
        return res.status(400).json({ error: 'Identifiant de salon invalide.' });
      }
      const { content, sharedChapterId } = req.body || {};
      if (typeof content !== 'string' || !content.trim() || content.length > 1000) {
        return res.status(400).json({ error: 'Le message doit contenir entre 1 et 1000 caractères.' });
      }

      let parsedSharedChapterId: number | null = null;
      if (sharedChapterId !== undefined && sharedChapterId !== null && sharedChapterId !== '') {
        const candidate = Number(sharedChapterId);
        if (!Number.isInteger(candidate) || candidate <= 0) {
          return res.status(400).json({ error: 'Identifiant de chapitre partagé invalide.' });
        }
        parsedSharedChapterId = candidate;
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
        sharedChapterId: parsedSharedChapterId,
      });

      broadcastEvent('chat:message', result.message, roomSlug);
      res.status(201).json(result);
    } catch (error: unknown) {
      sendRouteError(res, error, 'Erreur serveur');
    }
  });

  const server = http.createServer(app);

  // Serveur WebSocket temps réel sur le même port 3000 (/ws), charge utile plafonnée à 16 Ko
  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 16 * 1024 });

  wss.on('connection', (ws) => {
    const client: ConnectedClient = {
      clientId: crypto.randomUUID().slice(0, 8),
      ws,
      userUid: null,
      dbUserId: null,
      displayName: `Élève-${Math.floor(100 + Math.random() * 900)}`,
      gradeLevel: '6e',
      roomSlug: 'entraide-college',
      duelCode: null,
    };
    let msgTimestamps: number[] = [];
    clients.add(client);
    broadcastPresence();
    sendToClient(client, 'duel:lobby', { rooms: getDuelLobbyPayload() });

    ws.on('message', async (raw) => {
      const now = Date.now();
      msgTimestamps = msgTimestamps.filter((ts) => ts > now - 10_000);
      if (msgTimestamps.length >= 30) {
        ws.close(1008, 'Rate limit exceeded');
        return;
      }
      msgTimestamps.push(now);

      try {
        const data = JSON.parse(raw.toString());
        if (!data || typeof data !== 'object') return;

        if (
          data.type === 'auth' &&
          typeof data.token === 'string' &&
          data.token.length > 0 &&
          data.token.length <= 4096
        ) {
          try {
            const decoded = await adminAuth.verifyIdToken(data.token);
            const dbUser = await getOrCreateUser(
              decoded.uid,
              decoded.email || `${decoded.uid}@euleria.local`,
              decoded.name,
              decoded.picture
            );
            client.userUid = dbUser.uid;
            client.dbUserId = dbUser.id;
            client.displayName = dbUser.displayName;
            client.gradeLevel = dbUser.gradeLevel;
            broadcastPresence();
            if (client.duelCode) {
              const activeRoom = duelRooms.get(client.duelCode);
              if (activeRoom) broadcastDuelState(activeRoom);
            }
          } catch (authErr: unknown) {
            const code =
              typeof authErr === 'object' && authErr !== null && 'code' in authErr
                ? String((authErr as { code?: unknown }).code)
                : '';

            client.userUid = null;
            client.dbUserId = null;
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
        } else if (
          data.type === 'room:join' &&
          typeof data.roomSlug === 'string' &&
          ROOM_SLUG_REGEX.test(data.roomSlug.trim())
        ) {
          client.roomSlug = data.roomSlug.trim();
          broadcastPresence();
        } else if (data.type === 'duel:list') {
          pruneStaleDuels();
          sendToClient(client, 'duel:lobby', { rooms: getDuelLobbyPayload() });
        } else if (data.type === 'duel:create') {
          pruneStaleDuels();
          if (duelRooms.size >= 50) {
            sendToClient(client, 'duel:error', { message: 'Trop de duels actifs. Réessayez dans un instant.' });
            return;
          }
          removeClientFromDuel(client);

          const validSubjects = new Set<string>([
            'all',
            'mathematics',
            'physics_chemistry',
            'svt',
            'history_geography',
            'french_philosophy',
            'english_lv1',
          ]);
          const validGrades: GradeLevel[] = ['6e', '5e', '4e', '3e', '2nde', '1ere', 'terminale'];
          const reqSubject: SubjectId | 'all' =
            typeof data.subject === 'string' && validSubjects.has(data.subject)
              ? (data.subject as SubjectId | 'all')
              : 'all';
          const reqGrade: GradeLevel =
            typeof data.gradeLevel === 'string' && validGrades.includes(data.gradeLevel as GradeLevel)
              ? (data.gradeLevel as GradeLevel)
              : ((validGrades.includes(client.gradeLevel as GradeLevel) ? client.gradeLevel : '3e') as GradeLevel);
          const reqCount = Math.max(3, Math.min(8, Number(data.questionCount) || 5));

          const allChapters = (await getFullCurriculum()) as ChapterItem[];
          let pool = allChapters.filter(
            (c) => c.gradeLevel === reqGrade && (reqSubject === 'all' || c.subject === reqSubject)
          );
          if (pool.length === 0) {
            pool = allChapters.filter((c) => c.gradeLevel === reqGrade);
          }
          const chapterIds = pool.map((c) => c.id);
          const exMap = await getChapterExercisesForGenerator(chapterIds);
          const questions = generateDynamicQuiz(pool, allChapters, exMap, {
            questionCount: reqCount,
            difficulty: 'standard',
            mode: 'qcm',
          });

          const code = `EUL-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
          const room: DuelRoomInternal = {
            code,
            hostClientId: client.clientId,
            subject: reqSubject,
            gradeLevel: reqGrade,
            status: 'waiting',
            questions,
            currentIndex: 0,
            questionTimeLimitMs: 25_000,
            questionStartedAt: null,
            participants: new Map([
              [
                client.clientId,
                {
                  client,
                  score: 0,
                  correctCount: 0,
                  answeredCurrent: false,
                  xpAwarded: 0,
                },
              ],
            ]),
            lastRoundReveal: null,
            roundTimer: null,
            createdAt: Date.now(),
          };

          duelRooms.set(code, room);
          client.duelCode = code;
          broadcastDuelState(room);
          broadcastDuelLobby();
        } else if (data.type === 'duel:join' && typeof data.code === 'string') {
          const cleanCode = data.code.trim().toUpperCase().slice(0, 12);
          const room = duelRooms.get(cleanCode);
          if (!room) {
            sendToClient(client, 'duel:error', { message: 'Code de duel introuvable.' });
            return;
          }
          if (room.status !== 'waiting' && !room.participants.has(client.clientId)) {
            sendToClient(client, 'duel:error', { message: 'Ce duel a déjà commencé.' });
            return;
          }
          if (room.participants.size >= 6 && !room.participants.has(client.clientId)) {
            sendToClient(client, 'duel:error', { message: 'Ce duel est complet (6 participants max).' });
            return;
          }
          if (client.duelCode && client.duelCode !== cleanCode) {
            removeClientFromDuel(client);
          }
          if (!room.participants.has(client.clientId)) {
            room.participants.set(client.clientId, {
              client,
              score: 0,
              correctCount: 0,
              answeredCurrent: false,
              xpAwarded: 0,
            });
          }
          client.duelCode = cleanCode;
          broadcastDuelState(room);
          broadcastDuelLobby();
        } else if (data.type === 'duel:start' && typeof data.code === 'string') {
          const cleanCode = data.code.trim().toUpperCase();
          const room = duelRooms.get(cleanCode);
          if (!room || room.hostClientId !== client.clientId) return;
          if (room.status !== 'waiting') return;

          room.status = 'active';
          room.currentIndex = 0;
          room.questionStartedAt = Date.now();
          room.lastRoundReveal = null;
          for (const p of room.participants.values()) {
            p.score = 0;
            p.correctCount = 0;
            p.answeredCurrent = false;
            p.xpAwarded = 0;
          }
          broadcastDuelState(room);
          broadcastDuelLobby();

          room.roundTimer = setTimeout(() => {
            advanceDuelRound(room);
          }, room.questionTimeLimitMs);
        } else if (
          data.type === 'duel:answer' &&
          typeof data.code === 'string' &&
          typeof data.questionId === 'string' &&
          typeof data.answer === 'string'
        ) {
          const room = duelRooms.get(data.code.trim().toUpperCase());
          if (!room || room.status !== 'active') return;
          const participant = room.participants.get(client.clientId);
          if (!participant || participant.answeredCurrent) return;
          const activeQ = room.questions[room.currentIndex];
          if (!activeQ || activeQ.id !== data.questionId) return;

          const cleanAns = data.answer.trim().slice(0, 256);
          const isCorrect = evaluateExerciseAnswer(
            activeQ.exerciseType,
            cleanAns,
            activeQ.correctAnswer,
            activeQ.numericTolerance ?? 0.05
          );
          participant.answeredCurrent = true;
          if (isCorrect) {
            const elapsed = room.questionStartedAt ? Date.now() - room.questionStartedAt : 15_000;
            const remainingRatio = Math.max(
              0,
              Math.min(1, (room.questionTimeLimitMs - elapsed) / room.questionTimeLimitMs)
            );
            const speedBonus = Math.round(remainingRatio * 50);
            participant.score += 100 + speedBonus;
            participant.correctCount += 1;
          }

          const allAnswered = Array.from(room.participants.values()).every((p) => p.answeredCurrent);
          if (allAnswered) {
            advanceDuelRound(room);
          } else {
            broadcastDuelState(room);
          }
        } else if (data.type === 'duel:leave') {
          removeClientFromDuel(client);
          sendToClient(client, 'duel:left', {});
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });

    ws.on('close', () => {
      removeClientFromDuel(client);
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
