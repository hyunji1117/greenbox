// app/api/mobile/session/route.ts
// 앱의 웹뷰가 연다. 코드와 비밀값이 맞으면 웹뷰에 로그인 쿠키를 심고 첫 화면으로 보낸다
// 가입 전이거나 방침 동의가 필요하면 첫 화면에서 미들웨어가 동의 화면으로 보낸다 (웹뷰 안에서 동의)

import { NextResponse, type NextRequest } from 'next/server';
import {
  createSessionCookieValue,
  redeemHandoffCode,
  SESSION_MAX_AGE,
  sessionCookieName,
} from '@/app/lib/mobile/handoff';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code') ?? '';
  const verifier = request.nextUrl.searchParams.get('verifier') ?? '';
  const session = await redeemHandoffCode(code, verifier);
  if (!session) {
    return NextResponse.redirect(new URL('/login?mobile=failed', request.url));
  }
  const secure = request.nextUrl.protocol === 'https:';
  const name = sessionCookieName(secure);
  const res = NextResponse.redirect(new URL('/', request.url));
  res.cookies.set(name, await createSessionCookieValue(session, name), {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  // 주소에 남은 코드가 기록되지 않게 캐시하지 않는다
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
