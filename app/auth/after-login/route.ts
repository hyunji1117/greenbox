// app/auth/after-login/route.ts
// 구글 로그인 직후 들르는 경로
// 1) 로그인 전에 받은 동의를 DB에 저장
// 2) 현재 방침에 동의한 기록이 있으면 앱으로, 없으면 /consent로 보낸다

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { auth, unstable_update } from '@/auth';
import { recordConsents } from '@/app/lib/consent/record';
import {
  PENDING_CONSENT_COOKIE,
  POLICY_VERSION,
  hasAllRequired,
  isConsentType,
  type ConsentType,
} from '@/app/lib/consent/policies';

// 쿠키 값이 현재 방침 버전의 필수 동의일 때만 인정한다
function parsePending(raw: string | undefined): ConsentType[] | null {
  if (!raw) return null;
  try {
    const { types, version } = JSON.parse(raw);
    if (version !== POLICY_VERSION || !Array.isArray(types)) return null;
    const valid = types.filter(isConsentType);
    return hasAllRequired(valid) ? valid : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const store = await cookies();
  const pending = parsePending(store.get(PENDING_CONSENT_COOKIE)?.value);
  store.delete(PENDING_CONSENT_COOKIE);

  if (pending) {
    await recordConsents(
      session.user.id,
      pending,
      request.headers.get('user-agent'),
    );
  }

  const updated = await unstable_update({});
  redirect(updated?.consentVersion === POLICY_VERSION ? '/' : '/consent');
}
