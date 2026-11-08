'use client';
// app/consent/ConsentForm.tsx
// 동의 체크리스트. 가입 전이면 동의하는 순간 가입된다.
// 동의하지 않으면 로그아웃한다. (가입 전이면 서버에 저장된 것이 없다)
// 바뀐 방침에 다시 동의하는 회원에게는 아래 방침 링크에서 바뀐 부분을 빨간색으로 보여 준다
// 탈퇴 요청은 방침에 적힌 이메일로 받는다. 동의 화면에서 탈퇴를 권하지 않는다

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import ConsentChecklist from '@/app/components/auth/ConsentChecklist';
import { privacyLink } from '@/app/lib/consent/privacyLink';
import { agreeToCurrentPolicy, declineConsent } from '@/app/auth/actions';
import { hasAllRequired, type ConsentType } from '@/app/lib/consent/policies';
import { track } from '@/app/lib/analytics/gtag';

interface ConsentFormProps {
  email: string | null;
  isFirstLogin: boolean;
  // 다시 동의하는 회원이 마지막으로 동의한 방침 버전 (처음 가입이면 없음)
  changedSince?: string;
}

const ConsentForm: React.FC<ConsentFormProps> = ({
  email,
  isFirstLogin,
  changedSince,
}) => {
  const [consents, setConsents] = useState<ConsentType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const agreed = hasAllRequired(consents);
  const policy = privacyLink(changedSince);

  const handleAgree = () => {
    if (!agreed || isPending) return;
    setError(null);
    track('consent_agreed');
    startTransition(async () => {
      const result = await agreeToCurrentPolicy(consents);
      if (result?.error) setError(result.error);
    });
  };

  const handleDecline = () => {
    track('consent_declined');
    startTransition(async () => {
      await declineConsent();
    });
  };

  return (
    <div className="space-y-4">
      {/* 어떤 구글 계정으로 동의하는지 버튼을 누르기 전에 확인하게 한다 (계정이 여러 개인 사람) */}
      {email && (
        <p className="text-center text-xs text-gray-500">
          <span className="font-semibold text-gray-700">{email}</span>
          {isFirstLogin ? ' 계정으로 가입해요' : ' 계정으로 이용하고 있어요'}
        </p>
      )}

      <ConsentChecklist value={consents} onChange={setConsents} />

      {/* 동의 버튼과 아래 줄(방침, 로그아웃)은 한 묶음이라 사이를 띄우지 않는다 */}
      <div>
        <button
          type="button"
          onClick={handleAgree}
          disabled={!agreed || isPending}
          className="flex h-12 w-full items-center justify-center rounded-full bg-[#6B46C1] text-base font-semibold text-white shadow-md transition-colors hover:bg-[#603fad] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#6B46C1]"
        >
          {isPending ? '처리 중...' : '동의하고 시작하기'}
        </button>

        {/* 왼쪽은 방침 원문, 오른쪽은 나가기. 고를 수 있게 두되 거절을 앞세우지 않는다 */}
        {/* 시작과 끝을 위의 동의 상자 안쪽 글자(테두리 1px + 안쪽 여백 16px)와 맞춘다 */}
        <div className="flex items-center justify-between px-[17px]">
          <Link
            href={policy.href}
            target="_blank"
            className="flex h-10 items-center text-sm font-semibold text-[#553C9A] underline underline-offset-4"
          >
            {policy.label}
          </Link>
          <button
            type="button"
            onClick={handleDecline}
            disabled={isPending}
            className="flex h-10 items-center text-sm text-gray-500 underline-offset-4 hover:underline disabled:opacity-50"
          >
            {isFirstLogin ? '나가기' : '로그아웃'}
          </button>
        </div>
      </div>

      {error && <p className="text-center text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default ConsentForm;
