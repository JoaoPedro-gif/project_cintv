import { Request, Response, Router } from 'express';
import argon2 from 'argon2';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { authenticator } from 'otplib';
import { env } from '../../config/env';
import { Department } from '../../models/Department';
import { Role } from '../../models/Role';
import { User } from '../../models/User';
import { audit } from '../../models/AuditLog';
import { decrypt, encrypt, sha256 } from '../../utils/crypto';
import { asyncHandler, validate } from '../../utils/http';
import { requireAuth } from '../../middlewares/auth';
import { loginLimiter } from '../../middlewares/security';
import { codeSchema, loginSchema, registerSchema } from './auth.validators';

authenticator.options = { window: 1 };
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
export const authRouter = Router();

// Novo ID de sessão (evita fixação de sessão), mantendo o token CSRF
function newSession(req: Request, userId?: string, pendingUserId?: string) {
  const csrf = req.session.csrf;
  return new Promise<void>((resolve, reject) =>
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.csrf = csrf;
      if (userId) req.session.userId = userId;
      if (pendingUserId) { req.session.pendingUserId = pendingUserId; req.session.pendingAt = Date.now(); }
      req.session.save((e) => (e ? reject(e) : resolve()));
    }));
}

async function registerFailure(user: any) {
  const n = user.failedLoginAttempts + 1;
  user.failedLoginAttempts = n >= MAX_ATTEMPTS ? 0 : n;
  if (n >= MAX_ATTEMPTS) { user.lockUntil = new Date(Date.now() + LOCK_MS); await audit(user._id, 'auth.locked', 'user', String(user._id)); }
  await user.save();
}

async function finishLogin(req: Request, res: Response, user: any) {
  user.failedLoginAttempts = 0; user.lockUntil = null; user.lastLoginAt = new Date();
  await user.save();
  await newSession(req, String(user._id));
  await audit(user._id, 'auth.login', 'user', String(user._id));
  res.json({ ok: true });
}

authRouter.get('/csrf', (req, res) => {
  req.session.csrf ??= crypto.randomBytes(32).toString('hex');
  res.json({ csrfToken: req.session.csrf });
});

// Só funções públicas (nunca líder/admin) aparecem no cadastro
authRouter.get('/registration-options', asyncHandler(async (_req, res) => {
  const [depts, roles] = await Promise.all([
    Department.find({ isActive: true }).sort('name').lean(),
    Role.find({ isPublic: true, isActive: true }).sort('name').lean(),
  ]);
  res.json(depts.map((d) => ({
    id: d._id, name: d.name,
    roles: roles.filter((r) => String(r.departmentId) === String(d._id)).map((r) => ({ id: r._id, name: r.name })),
  })));
}));

authRouter.post('/register', loginLimiter, validate(registerSchema), asyncHandler(async (req, res) => {
  const b = req.body;
  if (env.ALLOWED_EMAIL_DOMAIN && !b.email.endsWith('@' + env.ALLOWED_EMAIL_DOMAIN))
    return void res.status(400).json({ message: `Use o e-mail corporativo (@${env.ALLOWED_EMAIL_DOMAIN})` });
  const role = await Role.findOne({ _id: b.roleId, departmentId: b.departmentId, isPublic: true, isActive: true });
  if (!role) return void res.status(400).json({ message: 'Departamento ou função inválidos' });
  if (await User.exists({ email: b.email })) return void res.status(409).json({ message: 'E-mail já cadastrado' });

  const user = await User.create({
    fullName: b.fullName, nickname: b.nickname, email: b.email,
    departmentId: b.departmentId, roleId: role._id,
    passwordHash: await argon2.hash(b.password, { type: argon2.argon2id }),
    isApproved: !env.REQUIRE_ADMIN_APPROVAL,
  });
  await audit(user._id, 'user.register', 'user', String(user._id));
  res.status(201).json({ message: user.isApproved ? 'Cadastro concluído.' : 'Cadastro enviado. Aguarde a aprovação de um administrador.' });
}));

authRouter.post('/login', loginLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const invalid = () => res.status(401).json({ message: 'E-mail ou senha inválidos' });
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) { await argon2.hash(password); return void invalid(); } // iguala o tempo de resposta
  if (user.lockUntil && user.lockUntil > new Date())
    return void res.status(423).json({ message: 'Conta bloqueada temporariamente. Tente novamente em alguns minutos.' });
  if (!(await argon2.verify(user.passwordHash, password))) { await registerFailure(user); return void invalid(); }
  if (!user.isApproved) return void res.status(403).json({ message: 'Seu cadastro ainda aguarda aprovação.' });
  if (!user.isActive) return void res.status(403).json({ message: 'Conta desativada.' });

  if (user.twoFactorEnabled) {
    await newSession(req, undefined, String(user._id));
    return void res.json({ requires2fa: true });
  }
  await finishLogin(req, res, user);
}));

authRouter.post('/login/2fa', loginLimiter, validate(codeSchema), asyncHandler(async (req, res) => {
  const id = req.session.pendingUserId;
  if (!id || Date.now() - (req.session.pendingAt ?? 0) > 5 * 60 * 1000)
    return void res.status(401).json({ message: 'Verificação expirada. Faça login novamente.' });
  const user = await User.findById(id).select('+twoFactorSecretEncrypted +recoveryCodeHashes');
  if (!user || !user.isActive || !user.isApproved || !user.twoFactorSecretEncrypted)
    return void res.status(401).json({ message: 'Verificação inválida.' });
  if (user.lockUntil && user.lockUntil > new Date()) return void res.status(423).json({ message: 'Conta bloqueada temporariamente.' });

  const code = req.body.code.replace(/\s/g, '');
  let ok = false;
  if (/^\d{6}$/.test(code)) ok = authenticator.check(code, decrypt(user.twoFactorSecretEncrypted));
  else { // código de recuperação de uso único
    const h = sha256(code.toLowerCase());
    if (user.recoveryCodeHashes.includes(h)) {
      ok = true;
      await User.updateOne({ _id: user._id }, { $pull: { recoveryCodeHashes: h } });
      await audit(user._id, 'auth.recovery_code_used', 'user', String(user._id));
    }
  }
  if (!ok) { await registerFailure(user); return void res.status(401).json({ message: 'Código inválido' }); }
  await finishLogin(req, res, user);
}));

authRouter.post('/logout', (req, res) =>
  req.session.destroy(() => { res.clearCookie('sid'); res.json({ ok: true }); }));

authRouter.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

// Configuração do 2FA: o segredo só vai ao banco depois que o usuário confirma um código válido
authRouter.post('/2fa/setup', requireAuth, asyncHandler(async (req, res) => {
  if (req.user!.twoFactorEnabled) return void res.status(409).json({ message: '2FA já está ativo' });
  const secret = authenticator.generateSecret();
  req.session.setupSecret = secret;
  const uri = authenticator.keyuri(req.user!.email, 'Plataforma de Dados', secret);
  res.json({ qrDataUrl: await QRCode.toDataURL(uri), secret });
}));

authRouter.post('/2fa/enable', requireAuth, loginLimiter, validate(codeSchema), asyncHandler(async (req, res) => {
  const secret = req.session.setupSecret;
  if (!secret) return void res.status(400).json({ message: 'Inicie a configuração do 2FA primeiro' });
  if (!authenticator.check(req.body.code.replace(/\s/g, ''), secret)) return void res.status(400).json({ message: 'Código inválido' });
  const codes = Array.from({ length: 10 }, () => crypto.randomBytes(5).toString('hex'));
  await User.updateOne({ _id: req.user!.id }, {
    twoFactorEnabled: true, twoFactorSecretEncrypted: encrypt(secret), recoveryCodeHashes: codes.map(sha256),
  });
  delete req.session.setupSecret;
  await audit(req.user!.id, 'auth.2fa_enabled', 'user', req.user!.id);
  res.json({ recoveryCodes: codes }); // exibidos uma única vez; só o hash fica salvo
}));
