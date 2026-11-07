// app/privacy/page.tsx
// 지금 적용 중인 개인정보처리방침. 방침을 바꾸면 policies.ts와 versions/에 새 버전을 추가한다
// 시행 시각이 지나면 자동으로 새 방침을 보여 주도록 요청마다 그린다
// 바로 이전 방침과 달라진 문장을 빨간색으로 보여 준다
// ?changedSince=버전: 동의 화면의 "바뀐 내용 보기"로 열면 그 버전에 동의한 뒤 바뀐 문장을 모두 빨간색으로 보여 준다

import type { Metadata } from 'next';
import {
  findPolicy,
  latestPolicyVersion,
  previousPolicyVersion,
} from '@/app/lib/consent/policies';
import PolicyDocument from './PolicyDocument';

export const metadata: Metadata = {
  title: '개인정보처리방침',
};

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ changedSince?: string | string[] }>;
}

export default async function PrivacyPage({ searchParams }: PageProps) {
  const { changedSince } = await searchParams;
  // 알려진 방침 버전일 때만 쓴다 (주소를 고쳐 넣은 값은 무시)
  const fromConsent =
    typeof changedSince === 'string' && findPolicy(changedSince)
      ? changedSince
      : undefined;
  const version = latestPolicyVersion();
  return (
    <PolicyDocument
      version={version}
      changedSince={fromConsent ?? previousPolicyVersion(version) ?? undefined}
    />
  );
}
