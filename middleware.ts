// middleware.ts
// 로그인 필수: 로그인과 현재 방침 동의가 없으면 /login 또는 /consent로 보낸다.
// 판단 기준은 auth.config.ts의 authorized 콜백.

import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

export default NextAuth(authConfig).auth;

export const config = {
  // 로그인 없이 열려야 하는 경로는 제외한다
  // api: 각 API가 직접 처리 / privacy: 동의 전에 읽어야 함 / install: PWA 설치 안내
  // 그 외 PWA 파일(manifest, 서비스워커)과 정적 파일
  matcher: [
    '/((?!api|_next/static|_next/image|privacy|install|manifest\\.json|sw\\.js|workbox-|worker-|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)$).*)',
  ],
};
