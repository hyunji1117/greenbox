'use client';
// app/components/common/PolicyNoticeBanner.tsx
// 개인정보처리방침 시행 전에 앱 위쪽에서 미리 알린다 (시행 7일 전에 배포해 두면 그 기간 동안 보인다)
// 시행일이 지나면 동의 화면이 대신 알린다. 다시 동의받지 않는 변경은 시행 뒤 7일 동안 여기서 알린다
// 닫으면 같은 버전은 이 기기에서 다시 보이지 않는다 (쿠키에 기록해 서버가 첫 HTML부터 빼고 그린다)

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { XIcon } from 'lucide-react';
import { track } from '@/app/lib/analytics/gtag';
import { policyDateLabel, upcomingPolicy } from '@/app/lib/consent/policies';
import {
  LEGACY_DISMISSED_KEY_PREFIX,
  rememberDismissed,
} from '@/app/lib/consent/policyNotice';

interface PolicyNoticeBannerProps {
  // 서버가 쿠키를 보고 정한 버전. 첫 HTML에 바로 그려 화면이 뜬 뒤 끼어들지 않게 한다
  noticeVersion: string | null;
}

const PolicyNoticeBanner: React.FC<PolicyNoticeBannerProps> = ({
  noticeVersion,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  // 예전 방식(기기 저장소)으로 닫은 기록이 있으면 쿠키로 옮기고 닫는다
  useEffect(() => {
    if (!noticeVersion) return;
    try {
      if (localStorage.getItem(LEGACY_DISMISSED_KEY_PREFIX + noticeVersion)) {
        rememberDismissed(noticeVersion);
        // 서버가 그린 배너를 기기 기록에 맞춰 한 번만 거둔다
        setIsDismissed(true);
      }
    } catch {
      // 저장소를 막은 브라우저는 쿠키 기록만 따른다
    }
  }, [noticeVersion]);

  if (!noticeVersion || isDismissed) return null;
  const isUpcoming = upcomingPolicy()?.version === noticeVersion;

  const dismiss = () => {
    rememberDismissed(noticeVersion);
    track('policy_notice_dismissed');
    setIsDismissed(true);
  };

  return (
    <div
      role="status"
      className="mx-4 mt-3 flex items-center gap-2 rounded-2xl bg-[#F1EDFA] py-2 pr-1 pl-4 text-sm text-[#553C9A] md:mx-auto md:max-w-2xl"
    >
      <p className="min-w-0 flex-1">
        {policyDateLabel(noticeVersion, false)}
        {isUpcoming
          ? '부터 개인정보처리방침이 바뀌어요.'
          : '에 개인정보처리방침이 바뀌었어요.'}{' '}
        <Link
          href={`/privacy/${noticeVersion}`}
          className="font-semibold whitespace-nowrap underline underline-offset-2"
        >
          {isUpcoming ? '무엇이 바뀌나요' : '무엇이 바뀌었나요'}
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
