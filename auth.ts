// auth.ts
// 서버 전용 Auth.js 설정. 사용자와 구글 계정은 DB에 저장하고, 로그인 상태는 JWT 쿠키로 확인한다.

import NextAuth from 'next-auth';
import PostgresAdapter from '@auth/pg-adapter';
import { authConfig } from './auth.config';
import { getPool } from '@/app/lib/db';
import { getAgreedPolicyVersion } from '@/app/lib/consent/record';

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth(
  () => ({
    ...authConfig,
    adapter: PostgresAdapter(getPool()),
    callbacks: {
      ...authConfig.callbacks,
      // 로그인 직후와 동의 저장 직후(update)에만 DB에서 동의 여부를 읽어 쿠키에 담는다
      async jwt({ token, user, trigger }) {
        if (user?.id) token.sub = user.id;
        if ((trigger === 'signIn' || trigger === 'update') && token.sub) {
          token.consentVersion = await getAgreedPolicyVersion(token.sub);
        }
        return token;
      },
    },
  }),
);
