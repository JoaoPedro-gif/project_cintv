import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Lock, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';

export default function Login() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [step, setStep] = useState<'pw' | '2fa'>('pw');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [show, setShow] = useState(false);
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
    <main className="auth-screen">
      <div className="auth-card">
        <div className="auth-avatar">{step === 'pw' ? <UserRound size={52} strokeWidth={1.5} /> : <ShieldCheck size={48} strokeWidth={1.5} />}</div>
        <h1 className="mt-4 text-center text-xs font-medium uppercase tracking-[0.3em] text-white/80">Plataforma de Dados</h1>
        <p className="mt-1 text-center text-xs text-white/50">
          {step === 'pw' ? 'Acesse com seu e-mail corporativo' : 'Digite o código do autenticador ou um código de recuperação'}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-7">
          {step === 'pw' ? (<>
            <div className="auth-line">
              <Mail size={16} className="shrink-0 text-white/80" />
              <input type="email" aria-label="E-mail corporativo" placeholder="E-mail corporativo" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="auth-line">
              <Lock size={16} className="shrink-0 text-white/80" />
              <input type={show ? 'text' : 'password'} aria-label="Senha" placeholder="Senha" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShow(!show)} className="text-white/70 hover:text-white">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </>) : (
            <div className="auth-line">
              <KeyRound size={16} className="shrink-0 text-white/80" />
              <input aria-label="Código de verificação" placeholder="Código de verificação" autoComplete="one-time-code" autoFocus value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
          )}

          {error && <p role="alert" className="auth-error">{error}</p>}
          <button className="auth-btn" disabled={busy}>{busy ? 'Verificando…' : step === 'pw' ? 'Entrar' : 'Confirmar'}</button>
          {step === '2fa' && (
            <button type="button" className="w-full text-xs text-white/60 hover:text-white" onClick={() => { setStep('pw'); setCode(''); setError(''); }}>Voltar</button>
          )}
        </form>

        <p className="mt-6 text-center text-xs text-white/60">
          Não tem conta? <Link className="font-medium text-brand-400 hover:text-brand-300" to="/register">Cadastre-se</Link>
        </p>
      </div>
    </main>
  );
}
