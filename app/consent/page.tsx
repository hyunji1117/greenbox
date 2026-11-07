// app/consent/page.tsx
// 동의 화면. 구글 로그인했지만 가입 전이거나, 회원이지만 현재 방침에 동의한 기록이 없을 때 온다.
// 가입 전이면 여기서 동의해야 가입되고, 회원이면 바뀐 방침에 다시 동의한다.

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AuthShell from '@/app/components/auth/AuthShell';
import ConsentForm from './ConsentForm';
import { APP_NAME } from '@/app/lib/brand';
import { findPolicy } from '@/app/lib/consent/policies';

export const metadata: Metadata = {
  title: '이용 동의',
};

export default async function ConsentPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const isFirstLogin = !session.registered;
  // 다시 동의하는 사람에게만 마지막으로 동의한 뒤 바뀐 부분을 방침에서 표시한다
  const changedSince =
    !isFirstLogin &&
    session.consentVersion &&
    findPolicy(session.consentVersion)
      ? session.consentVersion
      : undefined;

  return (
    <AuthShell
      hideFooter
      title={isFirstLogin ? '처음 오셨네요' : '개인정보처리방침이 바뀌었어요'}
      description={
        isFirstLogin ? (
          <>
            {APP_NAME}를 이용하려면
            <br />
            아래 필수 항목에 동의해 주세요.
          </>
        ) : undefined
      }
    >
      <ConsentForm
        email={session.user.email ?? null}
        isFirstLogin={isFirstLogin}
        changedSince={changedSince}
      />
    </AuthShell>
  );
}
