import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { ErrorBox } from '../ui';

export default function Setup2fa() {
  const { user, refresh } = useAuth();
  const nav = useNavigate();
  const [qr, setQr] = useState<{ qrDataUrl: string; secret: string } | null>(null);
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState('');

  const run = async (fn: () => Promise<void>) => { setError(''); try { await fn(); } catch (e: any) { setError(e.message); } };
  const start = () => run(async () => setQr(await api('/auth/2fa/setup', { method: 'POST', body: {} })));
  const enable = (e: FormEvent) => { e.preventDefault(); run(async () => setCodes((await api('/auth/2fa/enable', { body: { code } })).recoveryCodes)); };

  return (
    <div className="card max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Verificação em duas etapas</h1>
      {user!.mustSetup2fa && !codes && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">Seu perfil exige 2FA. Ative para acessar o restante da plataforma.</p>}
      {codes ? (<>
        <p className="text-sm">2FA ativado. Guarde estes códigos de recuperação em local seguro. <b>Eles não serão exibidos novamente</b> e cada um vale uma única vez.</p>
        <ul className="grid grid-cols-2 gap-2 font-mono text-sm">{codes.map((c) => <li key={c} className="rounded bg-slate-100 p-2 dark:bg-slate-800">{c}</li>)}</ul>
        <button className="btn" onClick={async () => { await refresh(); nav('/'); }}>Guardei os códigos, concluir</button>
      </>) : user!.twoFactorEnabled ? (
        <p className="text-sm">A verificação em duas etapas já está ativa na sua conta.</p>
      ) : !qr ? (
        <button className="btn" onClick={start}>Gerar QR Code</button>
      ) : (
        <form onSubmit={enable} className="space-y-3">
          <p className="text-sm">Escaneie com Google Authenticator, Microsoft Authenticator ou similar e digite o código de 6 dígitos.</p>
          <img src={qr.qrDataUrl} alt="QR Code do 2FA" className="h-48 w-48 rounded bg-white p-2" />
          <p className="text-xs text-slate-500">Sem câmera? Chave manual: <code>{qr.secret}</code></p>
          <input className="input max-w-48" inputMode="numeric" maxLength={6} placeholder="000000" value={code} onChange={(e) => setCode(e.target.value)} required />
          <button className="btn ml-2">Ativar</button>
        </form>
      )}
      <ErrorBox msg={error} />
    </div>
  );
}
