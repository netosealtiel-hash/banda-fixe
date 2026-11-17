import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { bandaStore } from './src/server/db';
import { GameSnapshot, GovRole } from './src/game/types';

function extractToken(req: Request): string | undefined {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return undefined;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '4mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, app: 'Vida na Banda 3D' });
  });

  // Register account (Email, Nome, Senha)
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { email, name, password } = req.body ?? {};
    const result = bandaStore.register(String(email ?? ''), String(name ?? ''), String(password ?? ''));
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    const feed = bandaStore.getWorldFeed(result.user.email);
    res.json({
      token: result.token,
      user: result.user,
      snapshot: result.snapshot,
      needsLottery: result.needsLottery,
      ...feed,
    });
  });

  // Login account (Email, Senha)
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};
    const result = bandaStore.login(String(email ?? ''), String(password ?? ''));
    if (!result.ok) {
      res.status(401).json({ error: result.error });
      return;
    }
    const feed = bandaStore.getWorldFeed(result.user.email);
    res.json({
      token: result.token,
      user: result.user,
      snapshot: result.snapshot,
      ...feed,
    });
  });

  // Restore session from token
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const token = extractToken(req);
    const acc = bandaStore.getAccountByToken(token);
    if (!acc) {
      res.status(401).json({ error: 'Sessão expirada.' });
      return;
    }
    const user = bandaStore.toAuthUser(acc);
    const feed = bandaStore.getWorldFeed(user.email);
    res.json({
      user,
      snapshot: { ...acc.snapshot, mode: 'playing' },
      ...feed,
    });
  });

  // Save player progress
  app.post('/api/save', (req: Request, res: Response) => {
    const token = extractToken(req);
    const snapshot = req.body?.snapshot as GameSnapshot | undefined;
    if (!token || !snapshot) {
      res.status(400).json({ error: 'Token ou progresso em falta.' });
      return;
    }
    const ok = bandaStore.saveSnapshot(token, snapshot);
    if (!ok) {
      res.status(401).json({ error: 'Sessão inválida.' });
      return;
    }
    res.json({ ok: true });
  });

  // Public world feed: global admin announcements & government election board
  app.get('/api/world/feed', (req: Request, res: Response) => {
    const token = extractToken(req);
    const acc = bandaStore.getAccountByToken(token);
    const feed = bandaStore.getWorldFeed(acc?.email);
    res.json({
      ...feed,
      latestMoneyKz: acc?.snapshot.moneyKz,
      accountCreatedAt: acc?.createdAt,
    });
  });

  // Run for Presidente / Ministro / Governador
  app.post('/api/gov/apply', (req: Request, res: Response) => {
    const token = extractToken(req);
    const acc = bandaStore.getAccountByToken(token);
    if (!acc) {
      res.status(401).json({ error: 'Faz login primeiro para te candidatares.' });
      return;
    }
    const role = req.body?.role as GovRole;
    if (!['Presidente', 'Ministro', 'Governador'].includes(role)) {
      res.status(400).json({ error: 'Cargo inválido.' });
      return;
    }
    const province = String(req.body?.province ?? 'Luanda');
    const slogan = String(req.body?.partyOrSlogan ?? '');
    const govCandidates = bandaStore.applyGovCandidate(acc, role, province, slogan);
    res.json({ ok: true, govCandidates });
  });

  // Vote in BandaGov
  app.post('/api/gov/vote', (req: Request, res: Response) => {
    const token = extractToken(req);
    const acc = bandaStore.getAccountByToken(token);
    if (!acc) {
      res.status(401).json({ error: 'Faz login primeiro para votar.' });
      return;
    }
    const candidateId = String(req.body?.candidateId ?? '');
    const result = bandaStore.voteGovCandidate(acc, candidateId);
    res.json(result);
  });

  // === OWNER ADMIN PANEL ROUTES ===
  app.get('/api/admin/players', (req: Request, res: Response) => {
    const acc = bandaStore.getAccountByToken(extractToken(req));
    if (!acc || !acc.isAdmin) {
      res.status(403).json({ error: 'Acesso exclusivo do Dono (ADM).' });
      return;
    }
    res.json({ players: bandaStore.adminListPlayers() });
  });

  app.post('/api/admin/give-money', (req: Request, res: Response) => {
    const acc = bandaStore.getAccountByToken(extractToken(req));
    if (!acc || !acc.isAdmin) {
      res.status(403).json({ error: 'Acesso exclusivo do Dono (ADM).' });
      return;
    }
    const targetEmail = String(req.body?.targetEmail ?? acc.email);
    const amountKz = Number(req.body?.amountKz ?? 0);
    const result = bandaStore.adminGiveMoney(targetEmail, amountKz);
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.json({
      ...result,
      players: bandaStore.adminListPlayers(),
    });
  });

  app.post('/api/admin/broadcast', (req: Request, res: Response) => {
    const acc = bandaStore.getAccountByToken(extractToken(req));
    if (!acc || !acc.isAdmin) {
      res.status(403).json({ error: 'Acesso exclusivo do Dono (ADM).' });
      return;
    }
    const message = String(req.body?.message ?? '');
    const announcements = bandaStore.adminBroadcast(acc.name, message);
    res.json({ ok: true, announcements });
  });

  app.post('/api/admin/set-age', (req: Request, res: Response) => {
    const acc = bandaStore.getAccountByToken(extractToken(req));
    if (!acc || !acc.isAdmin) {
      res.status(403).json({ error: 'Acesso exclusivo do Dono (ADM).' });
      return;
    }
    const targetEmail = String(req.body?.targetEmail ?? acc.email);
    const ageDays = Number(req.body?.ageDays ?? 3);
    const ok = bandaStore.adminSetAccountAgeDays(targetEmail, ageDays);
    res.json({ ok, players: bandaStore.adminListPlayers() });
  });

  const distDir = path.resolve(process.cwd(), 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distDir);

  if (isProd) {
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vida na Banda 3D server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
