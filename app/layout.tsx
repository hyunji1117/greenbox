import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '가족 냉장고 관리',
  description: '우리 가족의 스마트한 냉장고 관리 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body
        className={`${inter.className} min-h-dvh bg-white`}
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 70px)',
        }}
      >
        {children}
      </body>
    </html>
  );
}
