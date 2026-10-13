import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, LogOut, Menu, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useAuth } from './auth';

// Só entram no menu as telas que já existem; os demais módulos entram nas próximas etapas
const items = [{ to: '/', label: 'Início', icon: Home }, { to: '/2fa', label: 'Segurança (2FA)', icon: ShieldCheck }];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(document.documentElement.classList.contains('dark'));
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark', !dark);
    localStorage.setItem('theme', !dark ? 'dark' : 'light');
    setDark(!dark);
  };
  return (
    <div className="flex min-h-screen">
      <aside className={`${collapsed ? 'w-16' : 'w-60'} shrink-0 border-r border-slate-200 bg-white p-3 transition-all dark:border-slate-800 dark:bg-slate-900`}>
        <button aria-label="Recolher menu" onClick={() => setCollapsed(!collapsed)} className="mb-4 rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><Menu size={20} /></button>
        <nav className="space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end title={label}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <Icon size={18} />{!collapsed && label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-sm">{user!.nickname}</span>
          <button aria-label="Alternar tema" onClick={toggleTheme} className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
          <button aria-label="Sair" onClick={async () => { await logout(); nav('/login'); }} className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><LogOut size={18} /></button>
        </header>
        <main className="flex-1 p-6"><Outlet /></main>
      </div>
    </div>
  );
}
