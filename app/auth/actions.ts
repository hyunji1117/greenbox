'use server';
// app/auth/actions.ts
// 로그인, 동의, 로그아웃 서버 액션

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth, signIn, signOut, unstable_update } from '@/auth';
import { recordConsents } from '@/app/lib/consent/record';
import { setFamilyNickname } from '@/app/lib/user/profile';
import { registerWithConsents } from '@/app/lib/user/registration';
import { FAMILY_NICKNAME_MAX } from '@/app/lib/user/displayName';
import { hasAllRequired, isConsentType } from '@/app/lib/consent/policies';

type ActionResult = { error: string } | undefined;

// 로그인 화면: 구글로 이동한다.
// 돌아오면 미들웨어가 계정별 동의 기록(JWT)을 보고 첫 화면 또는 /consent로 보낸다.
export async function startGoogleLogin(): Promise<void> {
  await signIn('google', { redirectTo: '/' });
}

// 동의 화면: 현재 방침에 동의하고 앱으로 들어간다
// 가입 전이면 이때 처음으로 회원, 구글 계정 연결, 동의 기록을 함께 저장한다 (= 가입)
export async function agreeToCurrentPolicy(
  input: unknown[],
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const types = input.filter(isConsentType);
  if (!hasAllRequired(types)) return { error: '필수 항목에 모두 동의해 주세요' };

  const userAgent = (await headers()).get('user-agent');
  if (session.registered) {
    await recordConsents(session.user.id, types, userAgent);
  } else {
    const googleId = session.pendingGoogleId;
    if (!googleId) redirect('/login');
    await registerWithConsents(
      {
        googleId,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
      },
      types,
      userAgent,
    );
  }
  await unstable_update({}); // 쿠키(JWT)의 가입 여부와 동의 버전을 DB 기준으로 갱신
  redirect('/');
}

// 동의 화면에서 동의하지 않음: 로그아웃만 한다
// 가입 전이면 서버에 저장된 것이 없고, 기존 회원은 데이터를 그대로 둔다
export async function declineConsent(): Promise<void> {
  await signOut({ redirectTo: '/login' });
}

// 설정 > 계정: 가족 내 호칭 저장. 빈 값이면 호칭을 지운다.
export async function updateFamilyNickname(
  input: string,
): Promise<{ error: string } | { familyNickname: string | null }> {
  const session = await auth();
  if (!session?.registered) return { error: '로그인이 필요해요' };

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
