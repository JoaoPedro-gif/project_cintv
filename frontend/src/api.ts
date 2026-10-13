let csrf: string | null = null;
export const resetCsrf = () => { csrf = null; };

async function token() {
  if (!csrf) csrf = (await (await fetch('/api/auth/csrf', { credentials: 'include' })).json()).csrfToken;
  return csrf!;
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public errors?: Record<string, string[]>) { super(message); }
}

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}, retried = false): Promise<T> {
  const method = opts.method ?? (opts.body ? 'POST' : 'GET');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (method !== 'GET') headers['X-CSRF-Token'] = await token();
  const r = await fetch('/api' + path, { method, headers, credentials: 'include', body: opts.body ? JSON.stringify(opts.body) : undefined });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 403 && data.message === 'Token CSRF inválido' && !retried) { resetCsrf(); return api(path, opts, true); }
    const detail = data.errors ? Object.values(data.errors as Record<string, string[]>).flat().join(' · ') : '';
    throw new ApiError(detail || data.message || 'Erro inesperado', r.status, data.errors);
  }
  return data;
}
