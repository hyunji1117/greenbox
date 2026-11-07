// app/components/auth/AuthShell.tsx
// 로그인, 동의 화면 공통 틀 (로고, 제목, 설명, 하단 방침 링크)

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Nanum_Pen_Script } from 'next/font/google';

// 로고(손글씨 영문)와 어울리는 한글 손글씨. 로고 아래 한 줄에만 쓰고, 쓰인 글자 조각만 받는다
const logoHand = Nanum_Pen_Script({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});

interface AuthShellProps {
  title: string;
  // 없으면 제목만 보여 준다
  description?: React.ReactNode;
  children: React.ReactNode;
  // 동의 화면처럼 화면이 방침 링크를 직접 두는 곳에서는 맨 아래 링크를 빼서 두 번 보이지 않게 한다
  hideFooter?: boolean;
}

const AuthShell: React.FC<AuthShellProps> = ({
  title,
  description,
  children,
  hideFooter = false,
}) => (
  <main className="flex min-h-screen items-center justify-center bg-[#F0F0F4] px-4 py-10">
    <div className="w-full max-w-sm space-y-8">
      {/* 로고와 제목 사이를 넉넉히 띄워, 화면에 들어왔을 때 제목이 먼저 눈에 들어오게 한다 */}
      <header className="flex flex-col items-center gap-9 text-center">
        {/* 영문 로고만으로는 무슨 앱인지 알기 어려워 아래에 한글 이름을 붙인다 */}
        {/* 로고 그림 비율(3:2)에 맞춘 상자라 글자를 왼쪽에 맞추면 로고 왼쪽 끝과 줄이 맞는다 */}
        <div className="flex flex-col items-start">
          <div className="relative h-16 w-24">
            <Image
              src="/greenbox_logo_5_black.png"
              alt="Greenbox 로고"
              fill
              className="object-contain"
              priority
            />
          </div>
          {/* 로고 그림 아래 빈 공간만큼 끌어올려 로고에 붙은 설명처럼 보이게 한다 */}
          {/* 시작점을 로고 그림의 "O" 왼쪽 끝에 맞추고, F 꼬리에 가리지 않게 글자를 그림 위에 그린다 */}
          <p
            className={`${logoHand.className} relative -mt-2 ml-px text-lg leading-none text-[#553C9A]`}
          >
            우리집 냉장고
          </p>
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          {description && (
            <p className="text-sm leading-relaxed text-gray-500">
              {description}
            </p>
          )}
        </div>
      </header>

      {children}

      {!hideFooter && (
        <footer className="text-center">
          <Link
            href="/privacy"
            target="_blank"
            className="text-xs text-[#7b6d99] underline-offset-4 hover:underline"
          >
            개인정보처리방침
          </Link>
        </footer>
      )}
    </div>
  </main>
);

export default AuthShell;
