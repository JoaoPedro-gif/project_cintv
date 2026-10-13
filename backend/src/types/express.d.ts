import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    pendingUserId?: string;
    pendingAt?: number;
    csrf?: string;
    setupSecret?: string;
  }
}

export interface AuthUser {
  id: string; fullName: string; nickname: string; email: string;
  departmentId: string; teamId: string | null;
  permissions: string[]; twoFactorEnabled: boolean; mustSetup2fa: boolean;
}

declare global {
  namespace Express {
    interface Request { user?: AuthUser }
  }
}
