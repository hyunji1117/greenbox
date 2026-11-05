// app/privacy/PolicyDocument.tsx
// 개인정보처리방침 한 버전을 보여 주는 틀. 지금 적용 중인지, 시행 전인지, 지난 방침인지 함께 알린다

import Link from 'next/link';
import { APP_NAME } from '@/app/lib/brand';
import { OPERATOR } from '@/app/lib/consent/operator';
import {
  POLICY_RELEASES,
  currentPolicyVersion,
  policyDateLabel,
  upcomingPolicy,
} from '@/app/lib/consent/policies';
import { POLICY_BODIES } from './versions';

interface PolicyDocumentProps {
  version: string;
}

export default function PolicyDocument({ version }: PolicyDocumentProps) {
  const Body = POLICY_BODIES[version];
  const current = currentPolicyVersion();
  const upcoming = upcomingPolicy();
  const isCurrent = version === current;
  const isUpcoming = upcoming?.version === version;
  const others = POLICY_RELEASES.filter(r => r.version !== version).reverse();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <article className="mx-auto max-w-2xl space-y-8 rounded-2xl bg-white p-6 shadow-sm">
        <header className="space-y-2">
          <h1 className="text-xl font-bold text-gray-900">개인정보처리방침</h1>
          {isCurrent && upcoming && (
            <p className="rounded-xl bg-[#F1EDFA] px-3 py-2 text-sm text-[#553C9A]">
              {policyDateLabel(upcoming.version, false)}부터 방침이 바뀌어요.{' '}
              <Link
                href={`/privacy/${upcoming.version}`}
                className="font-semibold underline underline-offset-2"
              >
                바뀌는 방침 보기
              </Link>
            </p>
          )}
          {isUpcoming && (
            <p className="rounded-xl bg-[#F1EDFA] px-3 py-2 text-sm text-[#553C9A]">
              {policyDateLabel(version)}부터 적용되는 방침이에요. 그 전까지는{' '}
              <Link
                href="/privacy"
                className="font-semibold underline underline-offset-2"
              >
                지금 방침
              </Link>
              이 적용돼요.
            </p>
          )}
          {!isCurrent && !isUpcoming && (
            <p className="rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-600">
              지난 방침이에요.{' '}
              <Link
                href="/privacy"
                className="font-semibold underline underline-offset-2"
              >
                지금 방침 보기
              </Link>
            </p>
          )}
          <p className="text-sm text-gray-600">
            {OPERATOR.name}(이하 &lsquo;운영자&rsquo;)는 {APP_NAME}(이하
            &lsquo;서비스&rsquo;) 이용자의 개인정보를 「개인정보 보호법」에 따라
            보호하고, 관련 고충을 신속하게 처리하기 위해 다음과 같이
            개인정보처리방침을 둡니다.
          </p>
          <p className="text-xs text-gray-400">시행일: {version}</p>
        </header>

        <Body />

        {others.length > 0 && (
          <footer className="space-y-1 border-t border-gray-100 pt-4">
            <h2 className="text-sm font-semibold text-gray-700">다른 버전</h2>
            <ul className="space-y-1 text-sm">
              {others.map(r => (
                <li key={r.version}>
                  <Link
                    href={
                      r.version === current
                        ? '/privacy'
                        : `/privacy/${r.version}`
                    }
                    className="text-[#553C9A] underline underline-offset-2"
                  >
                    {policyDateLabel(r.version)} 시행
                  </Link>
                </li>
              ))}
            </ul>
          </footer>
        )}
      </article>
    </main>
  );
}
