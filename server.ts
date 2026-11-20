import 'dotenv/config';
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
  createChatMessage,
  getFullCurriculum,
  getStudyRoomsWithMessages,
  getUserDashboardData,
  recordExerciseAttempt,
} from './src/db/learning.ts';

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
