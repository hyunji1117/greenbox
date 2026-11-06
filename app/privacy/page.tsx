// app/privacy/page.tsx
// 지금 적용 중인 개인정보처리방침. 방침을 바꾸면 policies.ts와 versions/에 새 버전을 추가한다
// 시행 시각이 지나면 자동으로 새 방침을 보여 주도록 요청마다 그린다

import type { Metadata } from 'next';
import { latestPolicyVersion } from '@/app/lib/consent/policies';
import PolicyDocument from './PolicyDocument';

export const metadata: Metadata = {
  title: '개인정보처리방침',
};

export const dynamic = 'force-dynamic';

export default function PrivacyPage() {
  return <PolicyDocument version={latestPolicyVersion()} />;
}
