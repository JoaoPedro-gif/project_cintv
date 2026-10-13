import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { ErrorBox, Field, PasswordInput, Shell } from '../ui';

type Dept = { id: string; name: string; roles: { id: string; name: string }[] };

export default function Register() {
  const [depts, setDepts] = useState<Dept[]>([]);
  const [f, setF] = useState({ fullName: '', nickname: '', email: '', password: '', confirmPassword: '', departmentId: '', roleId: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const roles = depts.find((d) => d.id === f.departmentId)?.roles ?? [];

  useEffect(() => { api('/auth/registration-options').then(setDepts).catch((e) => setError(e.message)); }, []);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(''); setBusy(true);
    try { setDone((await api('/auth/register', { body: f })).message); }
    catch (err: any) { setError(err.message); } finally { setBusy(false); }
  }

  if (done) return <Shell title="Cadastro enviado"><p className="text-sm">{done}</p><Link className="btn mt-4 inline-block" to="/login">Ir para o login</Link></Shell>;

  return (
    <Shell title="Criar conta" subtitle="A liberação do acesso depende de aprovação de um administrador.">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Nome completo"><input className="input" value={f.fullName} onChange={(e) => set('fullName')(e.target.value)} required /></Field>
        <Field label="Como prefere ser chamado"><input className="input" value={f.nickname} onChange={(e) => set('nickname')(e.target.value)} required /></Field>
        <Field label="E-mail corporativo"><input className="input" type="email" value={f.email} onChange={(e) => set('email')(e.target.value)} required /></Field>
        <Field label="Senha (mín. 12 caracteres, com maiúsculas, minúsculas e números)"><PasswordInput value={f.password} onChange={set('password')} autoComplete="new-password" /></Field>
        <Field label="Confirmar senha"><PasswordInput value={f.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" /></Field>
        <Field label="Departamento">
          <select className="input" value={f.departmentId} onChange={(e) => setF((s) => ({ ...s, departmentId: e.target.value, roleId: '' }))} required>
            <option value="">Selecione…</option>{depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <Field label="Função">
          <select className="input" value={f.roleId} onChange={(e) => set('roleId')(e.target.value)} required disabled={!f.departmentId}>
            <option value="">Selecione…</option>{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </Field>
        <ErrorBox msg={error} />
        <button className="btn w-full" disabled={busy}>{busy ? 'Enviando…' : 'Cadastrar'}</button>
      </form>
      <p className="mt-4 text-center text-sm">Já tem conta? <Link className="text-indigo-600" to="/login">Entrar</Link></p>
    </Shell>
  );
}
