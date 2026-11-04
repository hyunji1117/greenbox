// app/_client/Analytics.tsx
// GA4 스크립트를 불러오고 주소가 바뀔 때마다 페이지 조회를 보낸다.
// 탭 이동은 주소의 ?tab=만 바뀌므로 경로와 검색어를 함께 보고 판단한다

'use client';

import { Suspense, useEffect } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { initAnalytics, trackPageView } from '@/app/lib/analytics/gtag';

function PageViewTracker({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    initAnalytics(gaId);
    trackPageView(window.location.href);
  }, [gaId, pathname, search]);

  return null;
}

export default function Analytics({ gaId }: { gaId?: string }) {
  if (!gaId) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Suspense fallback={null}>
        <PageViewTracker gaId={gaId} />
      </Suspense>
    </>
  );
}
