// auth.config.ts
// 미들웨어에서도 쓰는 Auth.js 공통 설정. DB 코드를 넣지 않는다.
// 로그인 필수: 로그인 + 현재 방침 동의가 있어야 앱에 들어갈 수 있다.

import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import { POLICY_VERSION } from '@/app/lib/consent/policies';

// 로그인은 했지만 아직 동의 기록이 없어도 들어갈 수 있는 경로
const CONSENT_FLOW_PATHS = ['/consent', '/auth/after-login'];

export const authConfig = {
  providers: [Google],
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  callbacks: {
    // 미들웨어가 요청마다 호출한다. 쿠키(JWT)만 보고 판단해서 DB를 조회하지 않는다.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const hasConsent = auth?.consentVersion === POLICY_VERSION;
      const { pathname } = nextUrl;

      if (pathname === '/login') {
        return isLoggedIn && hasConsent
          ? Response.redirect(new URL('/', nextUrl))
          : true;
      }
      if (!isLoggedIn) return false; // → /login

      if (CONSENT_FLOW_PATHS.some(p => pathname.startsWith(p))) return true;
      if (!hasConsent) return Response.redirect(new URL('/consent', nextUrl));
      return true;
    },
    jwt({ token }) {
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.consentVersion = token.consentVersion ?? null;
      return session;
    },
  },
} satisfies NextAuthConfig;
