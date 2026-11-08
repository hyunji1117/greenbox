'use client';
// app/error.tsx
// 화면을 그리다 오류가 나면 흰 화면 대신 다시 시도할 수 있게 하고, 오류를 운영 지표로 보낸다

import { useEffect } from 'react';
import { reportError } from '@/app/lib/telemetry/client';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError('render', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F0F0F4] p-6 text-center">
      <p className="text-base font-semibold text-gray-800">
        화면을 불러오지 못했어요
      </p>
      <p className="text-sm text-gray-500">
        잠시 뒤 다시 시도해 주세요. 문제가 계속되면 설정의 의견 보내기로 알려
        주세요.
      </p>
      <button
        type="button"
        onClick={reset}
        className="h-11 rounded-xl bg-[#6B46C1] px-5 text-sm font-semibold text-white"
      >
        다시 시도
      </button>
    </div>
  );
}
