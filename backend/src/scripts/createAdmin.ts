import readline from 'readline';
import argon2 from 'argon2';
import mongoose from 'mongoose';
import { connectDb } from '../config/db';
import { Department } from '../models/Department';
import { Role } from '../models/Role';
import { User } from '../models/User';
import { audit } from '../models/AuditLog';

// Uso: npm run create-admin  (a senha é digitada de forma oculta, nunca via argumento)
function ask(q: string, hidden = false): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  if (hidden) (rl as any)._writeToOutput = (s: string) => { if (s.includes(q)) process.stdout.write(s); };
  return new Promise((res) => rl.question(q, (a) => { rl.close(); if (hidden) console.log(); res(a.trim()); }));
}

async function main() {
  await connectDb();
  const adminRole = await Role.findOne({ name: 'Administrador' });
  const dept = await Department.findOne({ name: 'Dados' });
  if (!adminRole || !dept) throw new Error('Execute "npm run seed" antes.');

  const fullName = await ask('Nome completo: ');
  const nickname = await ask('Apelido: ');
  const email = (await ask('E-mail corporativo: ')).toLowerCase();
  const password = await ask('Senha (mín. 12 caracteres): ', true);
  if (password.length < 12) throw new Error('Senha muito curta.');
  if (await User.exists({ email })) throw new Error('E-mail já cadastrado.');

  const user = await User.create({
    fullName, nickname, email, departmentId: dept._id, roleId: adminRole._id,
    passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
    isApproved: true, isActive: true,
  });
  await audit(user._id, 'admin.bootstrap', 'user', String(user._id));
  console.log(`Administrador criado: ${email}. Ative o 2FA no primeiro login.`);
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e.message); process.exit(1); });
