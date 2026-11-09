'use client';
// app/mobile/login/AutoSubmit.tsx
// 열리자마자 구글 로그인으로 넘어간다. 자동으로 안 넘어가면 버튼을 누르면 된다

import { useEffect, useRef } from 'react';
import { startMobileLogin } from './actions';

export default function AutoSubmit({
  challenge,
  redirect,
}: {
  challenge: string;
  redirect: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    formRef.current?.requestSubmit();
  }, []);
  return (
    <form ref={formRef} action={startMobileLogin} className="mt-6">
      <input type="hidden" name="challenge" value={challenge} />
      <input type="hidden" name="redirect" value={redirect} />
      <button
        type="submit"
        className="h-12 w-full rounded-2xl bg-[#6B46C1] text-sm font-semibold text-white"
      >
        Google로 계속하기
      </button>
    </form>
  );
}
