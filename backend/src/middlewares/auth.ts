import { RequestHandler } from 'express';
import { User } from '../models/User';
import { asyncHandler } from '../utils/http';

// Recarrega o usuário a CADA requisição: desativar a conta ou mudar a função vale imediatamente.
export const requireAuth: RequestHandler = asyncHandler(async (req, res, next) => {
  const id = req.session.userId;
  if (!id) return void res.status(401).json({ message: 'Não autenticado' });

  const u: any = await User.findById(id).populate('roleId').lean();
  if (!u || !u.isActive || !u.isApproved || !u.roleId) {
    return void req.session.destroy(() => res.status(401).json({ message: 'Sessão inválida' }));
  }
  const permissions: string[] = u.roleId.permissions;
  // 2FA obrigatório para administradores e líderes
  const mustSetup2fa = !u.twoFactorEnabled && (permissions.includes('admin:users') || permissions.includes('ticket:assign'));

  req.user = {
    id: String(u._id), fullName: u.fullName, nickname: u.nickname, email: u.email,
    departmentId: String(u.departmentId), teamId: u.teamId ? String(u.teamId) : null,
    permissions, twoFactorEnabled: !!u.twoFactorEnabled, mustSetup2fa,
  };
  if (mustSetup2fa && req.baseUrl !== '/api/auth')
    return void res.status(403).json({ code: '2FA_SETUP_REQUIRED', message: 'Ative a verificação em duas etapas para continuar.' });
  next();
});

export const requirePermission = (...needed: string[]): RequestHandler => (req, res, next) => {
  if (!req.user || !needed.every((p) => req.user!.permissions.includes(p)))
    return void res.status(403).json({ message: 'Sem permissão para esta ação' });
  next();
};
