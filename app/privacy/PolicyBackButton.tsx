'use client';
// app/privacy/PolicyBackButton.tsx
// 처리방침을 다 읽고 돌아갈 곳. 앱 안에서 왔으면 보던 화면으로, 새 탭이나 바깥에서 바로 열었으면 첫 화면으로 간다
// 첫 화면은 로그인과 동의 상태에 따라 로그인 화면이나 동의 화면으로 다시 보내 준다

import React from 'react';
import { ChevronLeftIcon } from 'lucide-react';

interface BackContext {
  // 이 문서를 처음 불러온 주소의 경로 (앱 안에서 링크로 넘어왔으면 /privacy가 아니다)
  initialPath: string;
  referrer: string;
  origin: string;
  historyLength: number;
}

export function backTarget({
  initialPath,
  referrer,
  origin,
  historyLength,
}: BackContext): 'back' | 'home' {
  if (historyLength <= 1) return 'home';
  // 앱 화면에서 링크로 넘어오면 문서를 새로 불러오지 않아 referrer가 비어 있다
  if (!initialPath.startsWith('/privacy')) return 'back';
  return referrer.startsWith(origin) ? 'back' : 'home';
}

function initialDocumentPath(): string {
  const entry = performance.getEntriesByType('navigation')[0];
  try {
    return entry ? new URL(entry.name).pathname : window.location.pathname;
  } catch {
    return window.location.pathname;
  }
}

const PolicyBackButton: React.FC = () => {
  const goBack = () => {
    const target = backTarget({
      initialPath: initialDocumentPath(),
      referrer: document.referrer,
      origin: window.location.origin,
      historyLength: window.history.length,
    });
    if (target === 'back') window.history.back();
    else window.location.assign('/');
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className="flex h-11 items-center gap-0.5 rounded-xl pr-3 pl-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
    >
      <ChevronLeftIcon size={20} aria-hidden />
      돌아가기
    </button>
  );
};

export default PolicyBackButton;
