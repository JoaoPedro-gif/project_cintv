import crypto from 'crypto';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { RequestHandler } from 'express';
import { env } from '../config/env';

const EIGHT_HOURS = 8 * 60 * 60;

// criada só depois que o banco conectou, reaproveitando a mesma conexão do Mongoose
export const makeSessionMiddleware = () => session({
  name: 'sid',
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ client: mongoose.connection.getClient() as any, ttl: EIGHT_HOURS }),
  cookie: { httpOnly: true, sameSite: 'lax', secure: env.NODE_ENV === 'production', maxAge: EIGHT_HOURS * 1000 },
});

// Token CSRF guardado na sessão; o frontend busca em GET /api/auth/csrf e envia em X-CSRF-Token
export const csrfProtection: RequestHandler = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const a = Buffer.from(req.get('x-csrf-token') ?? '');
  const b = Buffer.from(req.session.csrf ?? '');
  if (!b.length || a.length !== b.length || !crypto.timingSafeEqual(a, b))
    return void res.status(403).json({ message: 'Token CSRF inválido' });
  next();
};

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false,
  message: { message: 'Muitas tentativas. Tente novamente em alguns minutos.' },
});

export const lookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false,
  message: { message: 'Muitas verificações. Aguarde alguns minutos.' },
});