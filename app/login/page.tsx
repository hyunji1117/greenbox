// app/login/page.tsx
// 로그인 화면. 로그인은 필수이고, 버튼은 모든 사람에게 같다.
// 처음 로그인한 계정이거나 방침이 바뀐 경우에만 로그인 후 /consent에서 동의를 받는다.
// 구글 OAuth 앱 게시 조건상 로그인 없이 앱 소개와 방침 링크를 볼 수 있어야 한다.
// 앱을 처음 연 사람이 무엇을 해 주는 앱인지 먼저 알 수 있게 하는 일 3가지를 보이고, 버튼은 엄지가 닿는 아래에 둔다

import type { Metadata } from 'next';
import Link from 'next/link';
import { BellRing, ShoppingBasket, UsersRound } from 'lucide-react';
import BrandLogo from '@/app/components/common/BrandLogo';
import LoginForm from './LoginForm';
import { APP_NAME } from '@/app/lib/brand';

export const metadata: Metadata = {
  title: '로그인',
};

const FEATURES = [
  {
    icon: BellRing,
    title: '유통기한 전에 알려 줘요',
    body: '곧 먹어야 할 식재료를 알려 줘요',
  },
  {
    icon: UsersRound,
    // 친구 의견(2026-11-10): "같은 냉장고를 본다"는 말은 사생활이 없다고 느낄 수 있다 → 기본은 나만 보기라는 사실을 먼저 말한다
    title: '공유는 내가 정해요',
    body: '가족과 공유할 수 있고, 나만 볼 수도 있어요',
  },
  {
    icon: ShoppingBasket,
    title: '장 본 건 냉장고로',
    body: '구매한 식재료를 한 번에 냉장고에 넣어요',
  },
] as const;

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-[#F0F0F4] px-6 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        {/* 로고, 앱 이름, 한 줄 소개는 동의/초대 화면처럼 가운데에 두고, 아래 하는 일 목록은 읽기 편하게 왼쪽 정렬로 둔다 */}
        <header className="flex flex-col items-center space-y-6 text-center">
          <BrandLogo priority />
          <div className="space-y-2">
            {/* 구글 OAuth 브랜딩 심사: 동의 화면의 앱 이름과 같은 이름이 첫 화면에 보여야 한다 */}
            <p className="text-sm font-semibold text-[#6B46C1]">{APP_NAME}</p>
            <h1 className="text-2xl leading-snug font-bold text-gray-900">
              냉장고 속 식재료,
              <br />
              버리기 전에 챙겨요
            </h1>
          </div>
        </header>

        <ul className="mt-10 space-y-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <li
              key={title}
              className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-[0_4px_20px_rgba(75,47,140,0.07)] ring-1 ring-black/5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#6B46C1]">
                <Icon size={22} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-base font-semibold text-gray-900">{title}</p>
                <p className="mt-0.5 text-sm text-gray-600">{body}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* 남는 높이를 위에 두어 버튼을 아래로 내리되, 화면 맨 끝(홈 바 근처)보다 조금 위인 엄지가 편한 자리에 둔다 */}
        <div className="mt-auto space-y-3 pt-10">
          <LoginForm />
          <p className="text-center">
            <Link
              href="/privacy"
              target="_blank"
              className="inline-flex h-10 items-center text-xs text-[#7b6d99] underline-offset-4 hover:underline"
            >
              개인정보처리방침
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
