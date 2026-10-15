import { FormEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AtSign, Briefcase, Building2, Camera, CheckCircle2, Eye, EyeOff, Lock, Mail, UserPlus, UserRound } from 'lucide-react';
import { api } from '../api';

type Dept = { id: string; name: string; roles: { id: string; name: string }[] };

const onlyLetters = (v: string) => v.replace(/[^\p{L}\p{M} ]/gu, '').replace(/ {2,}/g, ' ').replace(/^ /, '');
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const passOk = (p: string) => p.length >= 8 && /\p{Lu}/u.test(p) && /[^\p{L}\p{N}\s]/u.test(p);

// Recorta em quadrado e reduz para 240px (JPEG): foto leve e sem metadados
function toAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const S = 240, c = document.createElement('canvas');
      c.width = c.height = S;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, S, S);
      const m = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, S, S);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagem inválida')); };
    img.src = url;
  });
}

function Line({ icon: Icon, children }: { icon: typeof Mail; children: ReactNode }) {
  return <div className="auth-line"><Icon size={16} className="shrink-0 text-white/80" />{children}</div>;
}

export default function Register() {
  const [depts, setDepts] = useState<Dept[]>([]);
  const [f, setF] = useState({ fullName: '', nickname: '', email: '', password: '', confirmPassword: '', departmentId: '', roleId: '' });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof f) => (v: string) => setF((s) => ({ ...s, [k]: v }));
  const roles = depts.find((d) => d.id === f.departmentId)?.roles ?? [];

  const match = f.password === f.confirmPassword;
  const canSubmit = f.fullName.trim().length >= 3 && f.nickname.trim().length >= 2 && emailOk(f.email) &&
    emailMsg?.ok !== false && passOk(f.password) && match && !!f.departmentId && !!f.roleId;

  useEffect(() => { api('/auth/registration-options').then(setDepts).catch((e) => setError(e.message)); }, []);

  async function checkEmail() {
    setEmailTouched(true);
    if (!emailOk(f.email)) return setEmailMsg(null);
    try { await api('/auth/check-email?email=' + encodeURIComponent(f.email)); setEmailMsg({ ok: true, text: 'Domínio do e-mail verificado.' }); }
    catch (e: any) { setEmailMsg({ ok: false, text: e.message }); }
  }

  async function pickPhoto(file?: File) {
    if (!file) return;
    setError('');
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setError('Escolha uma imagem JPG, PNG ou WebP.');
    if (file.size > 8 * 1024 * 1024) return setError('A foto deve ter no máximo 8 MB.');
    try { setAvatar(await toAvatar(file)); } catch (e: any) { setError(e.message); }
  }

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(''); setBusy(true);
    try { setDone((await api('/auth/register', { body: { ...f, avatar: avatar ?? undefined } })).message); }
    catch (err: any) { setError(err.message); } finally { setBusy(false); }
  }

  if (done) return (
    <main className="auth-screen">
      <div className="auth-card text-center">
        <div className="auth-avatar"><CheckCircle2 size={48} strokeWidth={1.5} /></div>
        <h1 className="mt-4 text-xs font-medium uppercase tracking-[0.3em] text-white/80">Cadastro enviado</h1>
        <p className="mt-3 text-sm text-white/70">{done}</p>
        <Link to="/login" className="auth-btn mt-8 block text-center">Ir para o login</Link>
      </div>
    </main>
  );

  return (
    <main className="auth-screen">
      <div className="auth-card max-w-md">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { pickPhoto(e.target.files?.[0]); e.target.value = ''; }} />
        <button type="button" aria-label="Adicionar foto de perfil" onClick={() => fileRef.current?.click()}
          className="auth-avatar group relative overflow-hidden transition hover:border-brand-400">
          {avatar ? <img src={avatar} alt="Sua foto de perfil" className="h-full w-full object-cover" /> : <UserPlus size={44} strokeWidth={1.5} />}
          <span className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100"><Camera size={26} /></span>
        </button>
        <p className="mt-2 text-center text-[11px] text-white/50">{avatar ? 'Clique na foto para trocar' : 'Clique para adicionar uma foto (opcional)'}</p>

        <h1 className="mt-3 text-center text-xs font-medium uppercase tracking-[0.3em] text-white/80">Criar conta</h1>
        <p className="mt-1 text-center text-xs text-white/50">A liberação do acesso depende de aprovação de um administrador.</p>

        <form onSubmit={submit} className="mt-8 space-y-6">
          <Line icon={UserRound}><input aria-label="Nome completo" placeholder="Nome completo" value={f.fullName} onChange={(e) => set('fullName')(onlyLetters(e.target.value))} required /></Line>
          <Line icon={AtSign}><input aria-label="Como prefere ser chamado" placeholder="Como prefere ser chamado" value={f.nickname} onChange={(e) => set('nickname')(onlyLetters(e.target.value))} required /></Line>
          <div>
            <Line icon={Mail}><input type="email" aria-label="E-mail" placeholder="E-mail" autoComplete="username" value={f.email}
              onChange={(e) => { set('email')(e.target.value.trim()); setEmailMsg(null); }} onBlur={checkEmail} required /></Line>
            {emailTouched && f.email && !emailOk(f.email) && <p className="mt-1 text-[11px] text-brand-300">Digite um e-mail válido, como nome@empresa.com.br</p>}
            {emailMsg && <p className={`mt-1 text-[11px] ${emailMsg.ok ? 'text-emerald-300' : 'text-brand-300'}`}>{emailMsg.text}</p>}
          </div>
          <div>
            <Line icon={Lock}>
              <input type={show ? 'text' : 'password'} aria-label="Senha" placeholder="Senha" autoComplete="new-password" value={f.password} onChange={(e) => set('password')(e.target.value)} required />
              <button type="button" aria-label={show ? 'Ocultar senhas' : 'Mostrar senhas'} onClick={() => setShow(!show)} className="text-white/70 hover:text-white">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </Line>
            <p className={`mt-1 text-[11px] ${f.password && !passOk(f.password) ? 'text-brand-300' : 'text-white/40'}`}>Mínimo de 8 caracteres, com uma letra maiúscula e um símbolo especial (ex.: ! @ # $ %).</p>
          </div>
          <div>
            <Line icon={Lock}><input type={show ? 'text' : 'password'} aria-label="Confirmar senha" placeholder="Confirmar senha" autoComplete="new-password" value={f.confirmPassword} onChange={(e) => set('confirmPassword')(e.target.value)} required /></Line>
            {f.confirmPassword && <p className={`mt-1 text-[11px] ${match ? 'text-emerald-300' : 'text-brand-300'}`}>{match ? 'As senhas conferem.' : 'As senhas não coincidem.'}</p>}
          </div>
          <Line icon={Building2}>
            <select aria-label="Departamento" value={f.departmentId} onChange={(e) => setF((s) => ({ ...s, departmentId: e.target.value, roleId: '' }))} required>
              <option value="">Departamento</option>{depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Line>
          <Line icon={Briefcase}>
            <select aria-label="Função" value={f.roleId} onChange={(e) => set('roleId')(e.target.value)} required disabled={!f.departmentId}>
              <option value="">{f.departmentId ? 'Função' : 'Escolha o departamento primeiro'}</option>{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Line>

          {error && <p role="alert" className="auth-error">{error}</p>}
          <button className="auth-btn" disabled={busy || !canSubmit}>{busy ? 'Enviando…' : 'Cadastrar'}</button>
        </form>

        <p className="mt-6 text-center text-xs text-white/60">
          Já tem conta? <Link className="font-medium text-brand-400 hover:text-brand-300" to="/login">Entrar</Link>
        </p>
      </div>
    </main>
  );
}