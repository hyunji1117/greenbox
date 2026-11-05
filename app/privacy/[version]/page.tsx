// app/privacy/[version]/page.tsx
// 버전을 정해 보는 개인정보처리방침 (시행 전 방침 미리 보기, 지난 방침 열람)

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { findPolicy, policyDateLabel } from '@/app/lib/consent/policies';
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
  return <PolicyDocument version={version} />;
}
