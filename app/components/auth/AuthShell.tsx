// app/components/auth/AuthShell.tsx
// 로그인, 동의 화면 공통 틀 (로고, 제목, 설명, 하단 방침 링크)

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface AuthShellProps {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}

const AuthShell: React.FC<AuthShellProps> = ({
  title,
  description,
  children,
}) => (
  <main className="flex min-h-screen items-center justify-center bg-[#F0F0F4] px-4 py-10">
    <div className="w-full max-w-sm space-y-8">
      <header className="flex flex-col items-center gap-5 text-center">
        <div className="relative h-16 w-[210px]">
          <Image
            src="/greenbox_logo_5_black.png"
            alt="Greenbox 로고"
            fill
            className="object-contain"
            priority
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          <p className="text-sm leading-relaxed text-gray-500">{description}</p>
        </div>
      </header>

      {children}

      <footer className="text-center">
        <Link
          href="/privacy"
          target="_blank"
          className="text-xs text-[#7b6d99] underline-offset-4 hover:underline"
        >
          개인정보처리방침
        </Link>
      </footer>
    </div>
  </main>
);

export default AuthShell;
