'use client';
// app/consent/ConsentForm.tsx
// 동의 체크리스트. 가입 전이면 동의하는 순간 가입된다.
// 동의하지 않으면 로그아웃만 한다. (가입 전이면 서버에 저장된 것이 없다)

import React, { useState, useTransition } from 'react';
import ConsentChecklist from '@/app/components/auth/ConsentChecklist';
import { agreeToCurrentPolicy, declineConsent } from '@/app/auth/actions';
import {
  hasAllRequired,
  type ConsentType,
} from '@/app/lib/consent/policies';

interface ConsentFormProps {
  email: string | null;
  isFirstLogin: boolean;
}

const ConsentForm: React.FC<ConsentFormProps> = ({ email, isFirstLogin }) => {
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
        {isFirstLogin && (
          <p className="text-xs text-gray-400">
            동의하지 않으면 가입되지 않고, 구글 계정 정보도 저장하지 않아요
          </p>
        )}
      </div>

      {error && <p className="text-center text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default ConsentForm;
