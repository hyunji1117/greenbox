'use server';
// app/mobile/login/actions.ts
// 시스템 브라우저에서 앱 로그인을 시작한다. 지문(challenge)을 잠깐 쿠키에 두고 구글 로그인으로 보낸다

import { cookies } from 'next/headers';
import { signIn } from '@/auth';
import {
  CHALLENGE_COOKIE,
  CHALLENGE_PATTERN,
  isAllowedRedirect,
  REDIRECT_COOKIE,
} from '@/app/lib/mobile/handoff';

export async function startMobileLogin(formData: FormData) {
  const challenge = String(formData.get('challenge') ?? '');
  if (!CHALLENGE_PATTERN.test(challenge)) throw new Error('잘못된 요청입니다');
  const redirect = String(formData.get('redirect') ?? '');
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 10 * 60,
  };
  const jar = await cookies();
  jar.set(CHALLENGE_COOKIE, challenge, options);
  if (isAllowedRedirect(redirect)) jar.set(REDIRECT_COOKIE, redirect, options);
  await signIn('google', { redirectTo: '/api/mobile/handoff' });
}
