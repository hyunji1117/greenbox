// app/api/mobile/handoff/route.ts
// 시스템 브라우저에서 구글 로그인을 마치면 여기로 온다. 로그인 정보를 2분짜리 코드로 만들어 앱으로 돌려준다

import { NextResponse, type NextRequest } from 'next/server';
import {
  APP_REDIRECT,
  CHALLENGE_COOKIE,
  isAllowedRedirect,
  REDIRECT_COOKIE,
  CHALLENGE_PATTERN,
  createHandoffCode,
  readSessionToken,
  sessionCookieName,
} from '@/app/lib/mobile/handoff';

export const dynamic = 'force-dynamic';

const backToApp = (redirect: string, params: Record<string, string>) => {
  const url = new URL(redirect);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const res = NextResponse.redirect(url.toString(), 302);
  res.cookies.delete(CHALLENGE_COOKIE);
  res.cookies.delete(REDIRECT_COOKIE);
  return res;
};

export async function GET(request: NextRequest) {
  const saved = request.cookies.get(REDIRECT_COOKIE)?.value ?? '';
  const redirect = isAllowedRedirect(saved) ? saved : APP_REDIRECT;
  const challenge = request.cookies.get(CHALLENGE_COOKIE)?.value ?? '';
  if (!CHALLENGE_PATTERN.test(challenge)) {
    return backToApp(redirect, { error: 'expired' });
  }
  const secure = request.nextUrl.protocol === 'https:';
  const session = await readSessionToken(
    request.cookies.getAll(),
    sessionCookieName(secure),
  );
  if (!session) return backToApp(redirect, { error: 'no_session' });
  return backToApp(redirect, {
    code: await createHandoffCode(session, challenge),
  });
}
