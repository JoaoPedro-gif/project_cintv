import { Router } from 'express';
import { isValidObjectId } from 'mongoose';
import { User } from '../../models/User';
import { audit } from '../../models/AuditLog';
import { requireAuth, requirePermission } from '../../middlewares/auth';
import { asyncHandler } from '../../utils/http';

export const adminRouter = Router();
adminRouter.use(requireAuth, requirePermission('admin:users'));

adminRouter.get('/users/pending', asyncHandler(async (_req, res) => {
  res.json(await User.find({ isApproved: false })
    .select('fullName nickname email departmentId roleId createdAt')
    .populate('departmentId', 'name').populate('roleId', 'name').sort('createdAt').lean());
}));

adminRouter.post('/users/:id/approve', asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) return void res.status(400).json({ message: 'ID inválido' });
  const u = await User.findByIdAndUpdate(req.params.id, { isApproved: true });
  if (!u) return void res.status(404).json({ message: 'Usuário não encontrado' });
  await audit(req.user!.id, 'admin.user.approve', 'user', req.params.id);
  res.json({ ok: true });
}));
