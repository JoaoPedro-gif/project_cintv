import { z } from 'zod';

const oid = z.string().regex(/^[0-9a-f]{24}$/i);
const email = z.string().trim().toLowerCase().email('E-mail inválido').max(254);
// apenas letras (com acentos), separadas por um único espaço
const nameRe = /^[\p{L}\p{M}]+(?: [\p{L}\p{M}]+)*$/u;

export const registerSchema = z.object({
  fullName: z.string().trim().min(3).max(120).regex(nameRe, 'Nome completo: use apenas letras'),
  nickname: z.string().trim().min(2).max(40).regex(nameRe, 'Apelido: use apenas letras'),
  email,
  password: z.string().min(8, 'Mínimo de 8 caracteres').max(128)
    .refine((p) => /\p{Lu}/u.test(p), 'Inclua ao menos uma letra maiúscula')
    .refine((p) => /[^\p{L}\p{N}\s]/u.test(p), 'Inclua ao menos um símbolo especial (ex.: ! @ # $ %)'),
  confirmPassword: z.string(),
  departmentId: oid,
  roleId: oid,
  // foto opcional: JPEG em data URL, já reduzida pelo navegador (limite do corpo da requisição: 100 KB)
  avatar: z.string().max(80000).regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/, 'Foto inválida').optional(),
}).refine((d) => d.password === d.confirmPassword, { path: ['confirmPassword'], message: 'As senhas não coincidem' });

export const loginSchema = z.object({ email, password: z.string().min(1).max(128) });
export const codeSchema = z.object({ code: z.string().trim().min(6).max(20) });