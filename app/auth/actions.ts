'use server';
// app/auth/actions.ts
// 로그인, 동의, 로그아웃 서버 액션

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth, signIn, signOut, unstable_update } from '@/auth';
import { recordConsents } from '@/app/lib/consent/record';
import { setFamilyNickname } from '@/app/lib/user/profile';
import { FAMILY_NICKNAME_MAX } from '@/app/lib/user/displayName';
import {
  PENDING_CONSENT_COOKIE,
  POLICY_VERSION,
  hasAllRequired,
  isConsentType,
} from '@/app/lib/consent/policies';

type ActionResult = { error: string } | undefined;

// 로그인 화면: 동의 내용을 쿠키에 담아 두고 구글로 이동한다.
// 구글에서 돌아오면 /auth/after-login이 이 쿠키를 읽어 DB에 저장한다.
export async function startGoogleLogin(input: unknown[]): Promise<ActionResult> {
  const types = input.filter(isConsentType);
  if (!hasAllRequired(types)) return { error: '필수 항목에 모두 동의해 주세요' };

  (await cookies()).set(
    PENDING_CONSENT_COOKIE,
    JSON.stringify({ types, version: POLICY_VERSION }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // 구글에서 돌아오는 이동에도 쿠키가 따라오도록
      path: '/',
      maxAge: 60 * 10,
    },
  );
  await signIn('google', { redirectTo: '/auth/after-login' });
}

// 동의 화면: 현재 방침에 동의하고 앱으로 들어간다
export async function agreeToCurrentPolicy(
  input: unknown[],
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const types = input.filter(isConsentType);
  if (!hasAllRequired(types)) return { error: '필수 항목에 모두 동의해 주세요' };

  const userAgent = (await headers()).get('user-agent');
  await recordConsents(session.user.id, types, userAgent);
  await unstable_update({}); // 쿠키(JWT)의 동의 버전을 DB 기준으로 갱신
  redirect('/');
}

// 설정 > 계정: 가족 내 호칭 저장. 빈 값이면 호칭을 지운다.
export async function updateFamilyNickname(
  input: string,
): Promise<{ error: string } | { familyNickname: string | null }> {
  const session = await auth();
  if (!session?.user?.id) return { error: '로그인이 필요해요' };

  const nickname = input.trim() || null;
  if (nickname && nickname.length > FAMILY_NICKNAME_MAX) {
    return { error: `호칭은 ${FAMILY_NICKNAME_MAX}자까지 쓸 수 있어요` };
  }
  await setFamilyNickname(session.user.id, nickname);
  return { familyNickname: nickname };
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: '/login' });
}
