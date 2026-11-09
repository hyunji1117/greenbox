// app/mobile/login/page.tsx
// 모바일 앱이 시스템 브라우저로 여는 로그인 시작 화면 (앱 속 웹뷰에서는 구글 로그인이 막혀서)

import type { Metadata } from 'next';
import AuthShell from '@/app/components/auth/AuthShell';
import { CHALLENGE_PATTERN } from '@/app/lib/mobile/handoff';
import AutoSubmit from './AutoSubmit';

export const metadata: Metadata = { title: '앱 로그인' };

interface PageProps {
  searchParams: Promise<{
    challenge?: string | string[];
    redirect?: string | string[];
  }>;
}

export default async function MobileLoginPage({ searchParams }: PageProps) {
  const { challenge, redirect } = await searchParams;
  const valid =
    typeof challenge === 'string' && CHALLENGE_PATTERN.test(challenge);
  return (
    <AuthShell
      hideFooter
      title="앱으로 로그인"
      description={
        valid
          ? '구글 로그인을 마치면 앱으로 돌아가요.'
          : '앱에서 다시 로그인을 눌러 주세요.'
      }
    >
      {valid && (
        <AutoSubmit
          challenge={challenge}
          redirect={typeof redirect === 'string' ? redirect : ''}
        />
      )}
    </AuthShell>
  );
}
