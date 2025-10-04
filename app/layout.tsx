// app/layout.tsx
// RootLayout 컴포넌트에 PWA 설정 추가

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

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
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
