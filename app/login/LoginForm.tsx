'use client';
// app/login/LoginForm.tsx
// 동의 체크리스트와 구글 로그인 버튼

import React, { useState, useTransition } from 'react';
import ConsentChecklist from '@/app/components/auth/ConsentChecklist';
import { startGoogleLogin } from '@/app/auth/actions';
import {
  hasAllRequired,
  type ConsentType,
} from '@/app/lib/consent/policies';

// 구글 브랜드 가이드의 "G" 로고 (색상 변경 금지)
const GoogleLogo = () => (
  <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
    <path
      fill="#FFC107"
      d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
    />
    <path
      fill="#FF3D00"
      d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
    />
  </svg>
);

const LoginForm: React.FC = () => {
  const [consents, setConsents] = useState<ConsentType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const agreed = hasAllRequired(consents);

  const handleContinue = () => {
    if (!agreed || isPending) return;
    setError(null);
    startTransition(async () => {
      // 성공하면 서버에서 구글로 이동하고, 실패할 때만 결과가 돌아온다
      const result = await startGoogleLogin(consents);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="space-y-4">
      <ConsentChecklist value={consents} onChange={setConsents} />

      <button
        type="button"
        onClick={handleContinue}
        disabled={!agreed || isPending}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-gray-300 bg-white text-base font-semibold text-gray-800 shadow-md transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
      >
        <GoogleLogo />
        {isPending ? '구글로 이동하는 중...' : 'Google로 계속하기'}
      </button>

      {error ? (
        <p className="text-center text-xs text-red-500">{error}</p>
      ) : (
        !agreed && (
          <p className="text-center text-xs text-gray-400">
            필수 항목에 모두 동의하면 로그인할 수 있어요
          </p>
        )
      )}
    </div>
  );
};

export default LoginForm;
