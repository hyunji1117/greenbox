// auth.config.ts
// 미들웨어에서도 쓰는 Auth.js 공통 설정. DB 코드를 넣지 않는다.
// 로그인 필수: 가입(동의)한 회원이 현재 방침에 동의한 상태여야 앱에 들어갈 수 있다.

import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import { POLICY_VERSION } from '@/app/lib/consent/policies';

export const authConfig = {
  providers: [Google],
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  callbacks: {
    // 미들웨어가 요청마다 호출한다. 쿠키(JWT)만 보고 판단해서 DB를 조회하지 않는다.
    authorized({ auth, request: { nextUrl } }) {
      const isRegistered = !!auth?.registered;
      // 구글 로그인은 했지만 가입 전 (동의하면 가입)
      const isPendingSignup = !!auth?.pendingSignup;
      const isSignedIn = isRegistered || isPendingSignup;
      const hasConsent =
        isRegistered && auth?.consentVersion === POLICY_VERSION;
      const { pathname } = nextUrl;

      if (pathname === '/login') {
        if (!isSignedIn) return true;
        return Response.redirect(new URL(hasConsent ? '/' : '/consent', nextUrl));
      }
      if (!isSignedIn) return false; // → /login

      // 가입 전이거나 현재 방침 동의 기록이 없으면 동의 화면만 열어 준다
      if (pathname.startsWith('/consent')) return true;
      if (!hasConsent) return Response.redirect(new URL('/consent', nextUrl));
      return true;
    },
    jwt({ token }) {
      return token;
    },
    session({ session, token }) {
      session.user.id = token.uid ?? '';
      session.registered = !!token.uid;
      session.pendingSignup = !token.uid && !!token.pendingGoogleId;
      session.pendingGoogleId = token.uid ? null : (token.pendingGoogleId ?? null);
      session.consentVersion = token.consentVersion ?? null;
      return session;
    },
  },
} satisfies NextAuthConfig;
