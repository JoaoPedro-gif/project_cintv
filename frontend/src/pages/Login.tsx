import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { ErrorBox, Field, PasswordInput, Shell } from '../ui';

export default function Login() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [step, setStep] = useState<'pw' | '2fa'>('pw');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const r = step === 'pw' ? await api('/auth/login', { body: { email, password } }) : await api('/auth/login/2fa', { body: { code } });
      if (r.requires2fa) setStep('2fa');
      else { await refresh(); nav('/'); }
    } catch (err: any) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <Shell title="Plataforma de Dados" subtitle={step === 'pw' ? 'Entre com seu e-mail corporativo' : 'Digite o código do aplicativo autenticador ou um código de recuperação'}>
      <form onSubmit={submit} className="space-y-4">
        {step === 'pw' ? (<>
          <Field label="E-mail corporativo"><input className="input" type="email" value={email} autoComplete="username" onChange={(e) => setEmail(e.target.value)} required /></Field>
          <Field label="Senha"><PasswordInput value={password} onChange={setPassword} autoComplete="current-password" /></Field>
        </>) : (
          <Field label="Código de verificação"><input className="input" value={code} autoFocus autoComplete="one-time-code" onChange={(e) => setCode(e.target.value)} required /></Field>
        )}
        <ErrorBox msg={error} />
        <button className="btn w-full" disabled={busy}>{busy ? 'Verificando…' : step === 'pw' ? 'Entrar' : 'Confirmar'}</button>
        {step === '2fa' && <button type="button" className="w-full text-sm text-slate-500" onClick={() => { setStep('pw'); setCode(''); setError(''); }}>Voltar</button>}
      </form>
      <p className="mt-4 text-center text-sm">Não tem conta? <Link className="text-indigo-600" to="/register">Cadastre-se</Link></p>
    </Shell>
  );
}
