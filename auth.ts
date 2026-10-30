// auth.ts
// 서버 전용 Auth.js 설정. 로그인 상태는 JWT 쿠키(암호화)로 확인한다.
// 동의해야 가입된다: 구글 로그인만으로는 DB에 저장하지 않고 (어댑터 미사용),
// 가입은 /consent에서 동의할 때 app/lib/user/registration.ts가 처리한다.

import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { getAgreedPolicyVersion } from '@/app/lib/consent/record';
import { findUserIdByGoogleId } from '@/app/lib/user/registration';

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    // 로그인 직후와 가입 또는 동의 직후(update)에만 DB를 읽어 쿠키에 담는다
    async jwt({ token, account, trigger }) {
      if (trigger === 'signIn' && account?.provider === 'google') {
        const userId = await findUserIdByGoogleId(account.providerAccountId);
        token.uid = userId ?? undefined;
        // 가입 전이면 구글 식별자만 쿠키에 들고 있다가 동의할 때 가입에 쓴다
        token.pendingGoogleId = userId ? undefined : account.providerAccountId;
      }
      // 클라이언트가 보낸 값은 믿지 않고, 가입 여부는 DB에서 다시 찾는다
      if (trigger === 'update' && !token.uid && token.pendingGoogleId) {
        const userId = await findUserIdByGoogleId(token.pendingGoogleId);
        if (userId) {
          token.uid = userId;
          token.pendingGoogleId = undefined;
        }
      }
      if (trigger === 'signIn' || trigger === 'update') {
        token.consentVersion = token.uid
          ? await getAgreedPolicyVersion(token.uid)
          : null;
      }
      return token;
    },
  },
});
