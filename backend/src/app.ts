import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { makeSessionMiddleware, csrfProtection } from './middlewares/security';
import { errorHandler } from './utils/http';
import { authRouter } from './modules/auth/auth.routes';
import { adminRouter } from './modules/admin/admin.routes';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (env.NODE_ENV === 'production') app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(makeSessionMiddleware());
  app.use('/api', csrfProtection);

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);

  app.use(errorHandler);
  return app;
}