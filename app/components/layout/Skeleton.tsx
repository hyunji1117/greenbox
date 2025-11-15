// app/components/layout/Skeleton.tsx

'use client';

import React from 'react';

const Skeleton: React.FC = () => {
  return (
    <div className="flex h-screen bg-white">
      {/* 하단 내비게이션 자리 */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white/90">
        <div className="mx-auto flex h-16 max-w-screen-sm items-end justify-between px-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="flex h-full flex-1 flex-col items-center justify-center"
            >
              <div className="mb-1 h-6 w-6 animate-pulse rounded-full bg-gray-200" />
              <div className="h-2 w-12 animate-pulse rounded-full bg-gray-200" />
            </div>
          ))}
        </div>
      </div>

      {/* 메인 스켈레톤 */}
      <div className="flex-1 overflow-auto bg-[#F0F0F4] p-4 pb-20">
        {/* 상단 제목 */}
        <div className="mb-4 flex items-center justify-between">
          <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-24 animate-pulse rounded-xl bg-gray-200" />
        </div>

        {/* 카테고리 탭 스켈레톤 */}
        <div className="mb-4 flex space-x-2">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="h-9 w-20 animate-pulse rounded-xl bg-gray-200"
            />
          ))}
        </div>

        {/* 카드 리스트 스켈레톤 */}
        <div className="mb-6 flex space-x-4 overflow-x-auto">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="w-[180px] flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              <div className="h-32 w-full animate-pulse bg-gray-200" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-16 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>

        {/* 그래프/통계 영역 스켈레톤 */}
        <div className="mb-4 h-44 animate-pulse rounded-xl bg-gray-200" />
        <div className="h-40 animate-pulse rounded-xl bg-gray-200" />
      </div>
    </div>
  );
};

export default Skeleton;
