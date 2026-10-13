import { ReactNode, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function Shell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        <div className="mt-5">{children}</div>
      </div>
    </main>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm"><span className="mb-1 block font-medium">{label}</span>{children}</label>;
}

export function PasswordInput(p: { value: string; onChange: (v: string) => void; autoComplete?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input className="input pr-10" type={show ? 'text' : 'password'} value={p.value} autoComplete={p.autoComplete}
        onChange={(e) => p.onChange(e.target.value)} required />
      <button type="button" aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShow(!show)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
    </div>
  );
}

export const ErrorBox = ({ msg }: { msg: string }) =>
  msg ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{msg}</p> : null;
