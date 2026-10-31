// types/next-auth.d.ts
// 세션과 JWT에 동의한 방침 버전을 추가

import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: { id: string } & DefaultSession['user'];
    consentVersion: string | null;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    consentVersion?: string | null;
  }
}
