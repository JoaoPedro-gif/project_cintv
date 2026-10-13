import { z } from 'zod';

const oid = z.string().regex(/^[0-9a-f]{24}$/i);
const email = z.string().trim().toLowerCase().email().max(254);

export const registerSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  nickname: z.string().trim().min(2).max(40),
  email,
  password: z.string().min(12, 'Mínimo de 12 caracteres').max(128)
    .refine((p) => /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p), 'Use letras maiúsculas, minúsculas e números'),
  confirmPassword: z.string(),
  departmentId: oid,
  roleId: oid,
}).refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'As senhas não coincidem' });

export const loginSchema = z.object({ email, password: z.string().min(1).max(128) });
export const codeSchema = z.object({ code: z.string().trim().min(6).max(20) });
