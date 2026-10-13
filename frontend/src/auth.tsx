import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { api, resetCsrf } from './api';

export type User = { id: string; fullName: string; nickname: string; email: string; permissions: string[]; twoFactorEnabled: boolean; mustSetup2fa: boolean };
type Ctx = { user: User | null; loading: boolean; refresh: () => Promise<void>; logout: () => Promise<void>; can: (p: string) => boolean };
const AuthCtx = createContext<Ctx>(null as unknown as Ctx);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    try { setUser((await api('/auth/me')).user); } catch { setUser(null); }
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const logout = async () => { await api('/auth/logout', { method: 'POST', body: {} }).catch(() => {}); resetCsrf(); setUser(null); };
  const can = (p: string) => !!user?.permissions.includes(p);
  return <AuthCtx.Provider value={{ user, loading, refresh, logout, can }}>{children}</AuthCtx.Provider>;
}
