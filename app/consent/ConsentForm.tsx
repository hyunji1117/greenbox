'use client';
// app/consent/ConsentForm.tsx
// 동의 체크리스트. 가입 전이면 동의하는 순간 가입된다.
// 동의하지 않으면 로그아웃한다. (가입 전이면 서버에 저장된 것이 없다)
// 바뀐 방침에 다시 동의하는 회원에게는 바뀐 점을 먼저 보여 주고, 원하면 탈퇴를 요청할 수 있게 한다

import React, { useState, useTransition } from 'react';
import ConsentChecklist from '@/app/components/auth/ConsentChecklist';
import { agreeToCurrentPolicy, declineConsent } from '@/app/auth/actions';
import { hasAllRequired, type ConsentType } from '@/app/lib/consent/policies';
import { WITHDRAWAL_MAILTO } from '@/app/lib/consent/operator';

interface ConsentFormProps {
  email: string | null;
  isFirstLogin: boolean;
  changes: readonly string[];
}

const ConsentForm: React.FC<ConsentFormProps> = ({
  email,
  isFirstLogin,
  changes,
}) => {
  const [consents, setConsents] = useState<ConsentType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const agreed = hasAllRequired(consents);

  const handleAgree = () => {
    if (!agreed || isPending) return;
    setError(null);
    startTransition(async () => {
      const result = await agreeToCurrentPolicy(consents);
      if (result?.error) setError(result.error);
    });
  };

  const handleDecline = () => {
    startTransition(async () => {
      await declineConsent();
    });
  };

  return (
    <div className="space-y-4">
      {email && (
        <p className="text-center text-xs text-gray-500">
          <span className="font-semibold text-gray-700">{email}</span> 계정으로
          로그인했어요
        </p>
      )}

      {changes.length > 0 && (
        <section
          aria-labelledby="policy-changes"
          className="rounded-2xl bg-[#F1EDFA] px-4 py-3"
        >
          <h2
            id="policy-changes"
            className="mb-1.5 text-sm font-semibold text-[#553C9A]"
          >
            무엇이 바뀌었나요
          </h2>
          <ul className="list-disc space-y-1 pl-4 text-sm text-gray-700">
            {changes.map(change => (
              <li key={change}>{change}</li>
            ))}
          </ul>
        </section>
      )}

      <ConsentChecklist value={consents} onChange={setConsents} />

      <button
        type="button"
        onClick={handleAgree}
        disabled={!agreed || isPending}
        className="flex h-12 w-full items-center justify-center rounded-full bg-[#6B46C1] text-base font-semibold text-white shadow-md transition-colors hover:bg-[#603fad] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#6B46C1]"
      >
        {isPending ? '처리 중...' : '동의하고 시작하기'}
      </button>

      <div className="space-y-1 text-center">
        <button
          type="button"
          onClick={handleDecline}
          disabled={isPending}
          className="text-sm font-medium text-[#7b6d99] underline-offset-4 hover:underline disabled:opacity-50"
        >
          {isFirstLogin ? '동의하지 않고 나가기' : '동의하지 않고 로그아웃'}
        </button>
        {isFirstLogin ? (
          <p className="text-xs text-gray-400">
            동의하지 않으면 가입되지 않고, 구글 계정 정보도 저장하지 않아요
          </p>
        ) : (
          <p className="text-xs text-gray-400">
            로그아웃해도 내 정보와 냉장고는 그대로 남아요. 지우고 싶다면{' '}
            <a
              href={WITHDRAWAL_MAILTO}
              className="font-medium text-[#7b6d99] underline underline-offset-2"
            >
              탈퇴 요청하기
            </a>
          </p>
        )}
      </div>

      {error && <p className="text-center text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default ConsentForm;
