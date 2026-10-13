import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  // Parte 1B: sessão, CSRF, rotas de auth, RBAC
  return app;
}
