// app/components/auth/AuthShell.tsx
// 로그인, 동의 화면 공통 틀 (로고, 제목, 설명, 하단 방침 링크)

import React from 'react';
import Link from 'next/link';
import BrandLogo from '@/app/components/common/BrandLogo';

interface AuthShellProps {
  title: string;
  // 없으면 제목만 보여 준다
  description?: React.ReactNode;
  children: React.ReactNode;
  // 동의 화면처럼 화면이 방침 링크를 직접 두는 곳에서는 맨 아래 링크를 빼서 두 번 보이지 않게 한다
  hideFooter?: boolean;
  // 맨 아래 방침 링크를 동의 화면처럼 보라색 밑줄로 보이고, 바로 위 버튼에 붙여 한 묶음으로 둔다 (참여 화면)
  // 참여 화면에서는 보조 링크라 굵게 하지 않아 버튼과 시선을 다투지 않게 한다
  strongPrivacyLink?: boolean;
}

const AuthShell: React.FC<AuthShellProps> = ({
  title,
  description,
  children,
  hideFooter = false,
  strongPrivacyLink = false,
}) => (
  <main className="flex min-h-screen items-center justify-center bg-[#F0F0F4] px-4 pt-[calc(2.5rem+env(safe-area-inset-top,0px))] pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]">
    <div className="w-full max-w-sm space-y-8">
      {/* 로고와 제목 사이를 넉넉히 띄워, 화면에 들어왔을 때 제목이 먼저 눈에 들어오게 한다 */}
      <header className="flex flex-col items-center gap-9 text-center">
        <BrandLogo priority />
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          {description && (
            <p className="text-sm leading-relaxed text-gray-600 empty:hidden">
              {description}
            </p>
          )}
        </div>
      </header>

      {children}

      {!hideFooter && (
        <footer className={`text-center ${strongPrivacyLink ? '-mt-6' : ''}`}>
          <Link
            href="/privacy"
            target="_blank"
            className={
              strongPrivacyLink
                ? 'inline-flex h-10 items-center text-sm text-[#553C9A] underline underline-offset-4'
                : 'text-xs text-[#7b6d99] underline-offset-4 hover:underline'
            }
          >
            개인정보처리방침
          </Link>
        </footer>
      )}
    </div>
  </main>
);

export default AuthShell;
