// app/components/layout/Loading.tsx
'use client';

import Image from 'next/image';

interface LoadingProps {
  progress: number;
}

export default function Loading({ progress }: LoadingProps) {
  // 혹시 실수로 0 미만/100 초과가 들어와도 막아주기
  const clampedProgress = Math.max(0, Math.min(progress, 100));

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-white">
      <div className="relative flex flex-col items-center gap-6">
        {/* 로고 */}
        <div className="motion-safe:animate-logo-float relative h-20 w-[260px]">
          <Image
            src="/greenbox_logo_5_black.png"
            alt="Our Fridge 로고"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* 텍스트 */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700">
            우리집 냉장고를 정리하는 중이에요
          </p>
          <p className="mt-1 text-xs text-gray-400">
            식재료 상태와 장보기 리스트를 불러오고 있어요...
          </p>
        </div>

        {/* 프로그레스 바 (determinate) */}
        <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-[#6B46C1] transition-all duration-150"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
