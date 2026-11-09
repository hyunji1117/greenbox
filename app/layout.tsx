// app/layout.tsx
// RootLayout 컴포넌트에 PWA 설정 추가

import type { Metadata, Viewport } from 'next';
import { Nanum_Gothic } from 'next/font/google';
import './globals.css';
import PushSubscriber from './_client/PushSubscriber';
import Analytics from './_client/Analytics';
import Telemetry from './_client/Telemetry';
import PushOpenTracker from './_client/PushOpenTracker';
import UpdateWatcher from './_client/UpdateWatcher';
import NativeAppReady from './_client/NativeAppReady';
import { APP_NAME, APP_SHORT_NAME } from '@/app/lib/brand';
import QueryProvider from '@/app/lib/query/QueryProvider';
import DevServerBadge from '@/app/components/common/DevServerBadge';

// 외부 CSS로 불러오면 글꼴 CSS를 받을 때까지 화면이 멈추고, 글꼴이 올 때까지 글자가 보이지 않는다.
// 빌드할 때 내려받아 같은 도메인에서 제공하고, 크기를 맞춘 대체 글꼴로 먼저 그려 글꼴 교체 때 화면이 밀리지 않게 한다.
// 앱은 400과 700(font-bold, font-semibold는 700, font-medium은 400으로 그려짐)만 쓴다
// 한글은 글자 범위별 조각 파일 수십 개로 나뉘어 있어 미리 받지 않고, 화면에 쓰인 글자의 조각만 받게 둔다
const nanumGothic = Nanum_Gothic({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-nanum-gothic',
});

// Next.js가 head에 기본 viewport 태그를 넣으므로 직접 쓴 태그는 뒤에 오는 기본값에 덮인다. viewport는 여기서만 정한다
// viewport-fit=cover: 상태 표시줄과 홈 바 자리까지 화면을 채우고, 화면마다 env(safe-area-inset-*)으로 기기 높이만큼 비켜 선다
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s | ${APP_NAME}` },
  applicationName: APP_NAME,
  description: '우리 가족의 스마트한 냉장고 관리 앱 서비스',
  manifest: '/manifest.json',
  // Google Search Console 소유권 확인 (구글 OAuth 브랜딩 심사에 필요, 확인 후에도 지우지 않는다)
  verification: { google: 'xwuP85KXgrKYQEizrQQHB94K-S6UP7UWEUO8QjjgUZo' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={nanumGothic.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4b2f8c" />
        <link rel="apple-touch-icon" href="/our-fridge_logo2_192_bgwhite.png" />

        {/* PWA 메타 태그 */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={APP_SHORT_NAME} />
      </head>
      <body>
        <DevServerBadge />
        <Analytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        <Telemetry />
        <PushOpenTracker />
        <UpdateWatcher />
        <NativeAppReady />

        <PushSubscriber />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
