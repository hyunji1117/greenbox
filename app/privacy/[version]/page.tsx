// app/privacy/[version]/page.tsx
// 버전을 정해 보는 개인정보처리방침 (시행 전 방침 미리 보기, 지난 방침 열람)
// 현재 방침(/privacy)과 같이 바로 이전 방침과 달라진 글자를 빨간색으로 보여 준다 (앱 안 배너의 "무엇이 바뀌었나요"가 여기로 온다)

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  findPolicy,
  policyDateLabel,
  previousPolicyVersion,
} from '@/app/lib/consent/policies';
import PolicyDocument from '../PolicyDocument';
import { POLICY_BODIES } from '../versions';

interface PageProps {
  params: Promise<{ version: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { version } = await params;
  return {
    title: findPolicy(version)
      ? `개인정보처리방침 (${policyDateLabel(version)} 시행)`
      : '개인정보처리방침',
  };
}

export const dynamic = 'force-dynamic';

export default async function PrivacyVersionPage({ params }: PageProps) {
  const { version } = await params;
  if (!findPolicy(version) || !POLICY_BODIES[version]) notFound();
  return (
    <PolicyDocument
      version={version}
      changedSince={previousPolicyVersion(version) ?? undefined}
    />
  );
}
