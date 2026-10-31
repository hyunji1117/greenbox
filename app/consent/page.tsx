// app/consent/page.tsx
// 동의 화면. 로그인했지만 현재 방침에 동의한 기록이 없을 때 온다.
// (처음 로그인하면서 동의가 저장되지 않았거나, 방침 버전이 바뀐 경우)

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AuthShell from '@/app/components/auth/AuthShell';
import ConsentForm from './ConsentForm';
import { APP_NAME } from '@/app/lib/brand';

export const metadata: Metadata = {
  title: '이용 동의',
};

export default async function ConsentPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <AuthShell
      title="이용 동의가 필요해요"
      description={
        <>
          {APP_NAME}를 이용하려면 아래 필수 항목에 동의해 주세요.
          <br />
          개인정보처리방침이 바뀌면 다시 동의를 받아요.
        </>
      }
    >
      <ConsentForm email={session.user.email ?? null} />
    </AuthShell>
  );
}
