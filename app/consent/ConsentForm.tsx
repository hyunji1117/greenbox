'use client';
// app/consent/ConsentForm.tsx
// 재동의 체크리스트. 동의하지 않으면 로그아웃한다.

import React, { useState, useTransition } from 'react';
import ConsentChecklist from '@/app/components/auth/ConsentChecklist';
import { agreeToCurrentPolicy, logout } from '@/app/auth/actions';
import {
  hasAllRequired,
  type ConsentType,
} from '@/app/lib/consent/policies';

interface ConsentFormProps {
  email: string | null;
}

const ConsentForm: React.FC<ConsentFormProps> = ({ email }) => {
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

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
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

      <button
        type="button"
        onClick={handleLogout}
        disabled={isPending}
        className="w-full text-center text-sm font-medium text-[#7b6d99] underline-offset-4 hover:underline disabled:opacity-50"
      >
        동의하지 않고 로그아웃
      </button>

      {error && <p className="text-center text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default ConsentForm;
