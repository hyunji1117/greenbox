// app/layout.tsx
// RootLayout 컴포넌트에 PWA 설정 추가

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import PushSubscriber from './_client/PushSubscriber';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '우리집 냉장고 식재료 관리',
  description: '우리 가족의 스마트한 냉장고 관리 앱 서비스',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4b2f8c" />
        <link rel="apple-touch-icon" href="/our-fridge_logo2_192_bgwhite.png" />

        {/* PWA 메타 태그 */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Greenbox" />
      </head>
      <body className={inter.className}>
        <PushSubscriber />
        {children}
      </body>
    </html>
  );
}
