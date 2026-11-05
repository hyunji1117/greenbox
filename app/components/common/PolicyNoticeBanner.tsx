'use client';
// app/components/common/PolicyNoticeBanner.tsx
// 개인정보처리방침 시행 전에 앱 위쪽에서 미리 알린다 (시행 7일 전에 배포해 두면 그 기간 동안 보인다)
// 닫으면 같은 버전은 이 기기에서 다시 보이지 않는다. 시행일이 지나면 동의 화면이 대신 알린다

import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { XIcon } from 'lucide-react';
import { policyDateLabel, upcomingPolicy } from '@/app/lib/consent/policies';

const DISMISSED_KEY_PREFIX = 'greenbox_policy_notice_dismissed_';

// 서버에서 그릴 때는 기기의 닫음 기록을 모르므로 그리지 않고, 화면이 뜬 뒤 판단한다
function readNoticeVersion(): string | null {
  const upcoming = upcomingPolicy();
  if (!upcoming) return null;
  try {
    if (localStorage.getItem(DISMISSED_KEY_PREFIX + upcoming.version)) {
      return null;
    }
  } catch {
    // 저장소를 막은 브라우저는 매번 보여 준다
  }
  return upcoming.version;
}

const subscribe = () => () => {};

const PolicyNoticeBanner: React.FC = () => {
  const noticeVersion = useSyncExternalStore(
    subscribe,
    readNoticeVersion,
    () => null,
  );
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);
  if (!noticeVersion || dismissedVersion === noticeVersion) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY_PREFIX + noticeVersion, '1');
    } catch {
      // 저장하지 못해도 지금 화면에서는 닫는다
    }
    setDismissedVersion(noticeVersion);
  };

  return (
    <div
      role="status"
      className="mx-4 mt-3 flex items-center gap-2 rounded-2xl bg-[#F1EDFA] py-2 pr-1 pl-4 text-sm text-[#553C9A] md:mx-auto md:max-w-2xl"
    >
      <p className="min-w-0 flex-1">
        {policyDateLabel(noticeVersion, false)}부터 개인정보처리방침이 바뀌어요.{' '}
        <Link
          href={`/privacy/${noticeVersion}`}
          className="font-semibold whitespace-nowrap underline underline-offset-2"
        >
          무엇이 바뀌나요
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="방침 변경 안내 닫기"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl hover:bg-white/60"
      >
        <XIcon size={16} />
      </button>
    </div>
  );
};

export default PolicyNoticeBanner;
