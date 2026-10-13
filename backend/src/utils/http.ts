import { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';
import { z } from 'zod';

// Express 4 não captura erros de funções async sozinho
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => unknown): RequestHandler =>
  (req, res, next) => { Promise.resolve(fn(req, res, next)).catch(next); };

export const validate = (schema: z.ZodTypeAny): RequestHandler => (req, res, next) => {
  const r = schema.safeParse(req.body);
  if (!r.success) return void res.status(400).json({ message: 'Dados inválidos', errors: r.error.flatten().fieldErrors });
  req.body = r.data;
  next();
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err?.code === 11000) return void res.status(409).json({ message: 'Registro duplicado' });
  console.error(err?.message); // nunca registrar corpo da requisição (pode ter senha)
  res.status(500).json({ message: 'Erro interno do servidor' });
};
