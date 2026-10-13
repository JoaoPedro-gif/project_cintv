import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { ErrorBox } from '../ui';

type Pending = { _id: string; fullName: string; email: string; departmentId?: { name: string }; roleId?: { name: string } };

function PendingApprovals() {
  const [list, setList] = useState<Pending[] | null>(null);
  const [error, setError] = useState('');
  const load = () => api('/admin/users/pending').then(setList).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  const approve = async (id: string) => { try { await api(`/admin/users/${id}/approve`, { body: {} }); load(); } catch (e: any) { setError(e.message); } };
  return (
    <section className="card">
      <h2 className="mb-3 font-semibold">Cadastros aguardando aprovação</h2>
      <ErrorBox msg={error} />
      {list && !list.length && <p className="text-sm text-slate-500">Nenhum cadastro pendente.</p>}
      <ul className="divide-y divide-slate-200 dark:divide-slate-800">
        {list?.map((u) => (
          <li key={u._id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span><b>{u.fullName}</b> · {u.email}<br /><span className="text-slate-500">{u.departmentId?.name} · {u.roleId?.name}</span></span>
            <button className="btn" onClick={() => approve(u._id)}>Aprovar</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Home() {
  const { user, can } = useAuth();
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Olá, {user!.nickname}!</h1>
      <section className="card">
        <h2 className="mb-2 font-semibold">Suas permissões</h2>
        <div className="flex flex-wrap gap-2">{user!.permissions.map((p) => <span key={p} className="rounded-full bg-indigo-100 px-3 py-1 text-xs text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">{p}</span>)}</div>
      </section>
      {can('admin:users') && <PendingApprovals />}
    </div>
  );
}
