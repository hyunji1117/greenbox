// types/next-auth.d.ts
// 세션과 JWT에 가입 여부와 동의한 방침 버전을 추가

import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    // 가입한 회원 id (users.id). 가입 전이면 빈 문자열
    user: { id: string } & DefaultSession['user'];
    registered: boolean;
    // 구글 로그인은 했지만 아직 동의하지 않아 가입 전인 상태
    pendingSignup: boolean;
    // 가입 전 사용자의 구글 계정 식별자 (동의할 때 가입에 쓴다)
    pendingGoogleId: string | null;
    consentVersion: string | null;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    uid?: string;
    pendingGoogleId?: string;
    consentVersion?: string | null;
  }
}
