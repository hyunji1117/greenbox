// app/PageClient.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import PolicyNoticeBanner from '@/app/components/common/PolicyNoticeBanner';
import BottomNavigation from '@/app/components/layout/BottomNavigation';
import { FridgeProvider } from '@/app/context/FridgeContext';
import { goToTab, paramToTab } from '@/app/lib/navigation/tabs';

// 탭 콘텐츠 로딩 중 깜빡임 방지용 경량 스켈레톤
// (하단 네비게이션은 이미 렌더링돼 있으므로 콘텐츠 영역만 표시)
const TabSkeleton = () => (
  <div className="space-y-4 p-4">
    <div className="flex items-center justify-between">
      <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
      <div className="h-8 w-24 animate-pulse rounded-xl bg-gray-200" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-200" />
      ))}
    </div>
  </div>
);

// 각 탭을 동적 import로 분리 → 해당 탭을 열 때만 청크 로드.
// 첫 탭이 냉장고면 서버가 그린 fridgeSlot을 쓰고, 나머지 경우는 클라이언트에서 불러온다.
const FridgeBoard = dynamic(
  () => import('@/app/components/fridge/FridgeBoard'),
  { ssr: false, loading: () => <TabSkeleton /> },
);
const IngredientsBoard = dynamic(
  () => import('@/app/components/ingredients/IngredientsBoard'),
  { ssr: false, loading: () => <TabSkeleton /> },
);
const StatsPage = dynamic(() => import('@/app/components/stats/StatsPage'), {
  ssr: false,
  loading: () => <TabSkeleton />,
});
const GroceryListPage = dynamic(
  () => import('@/app/components/grocery-list/GroceryListPage'),
  { ssr: false, loading: () => <TabSkeleton /> },
);
const SettingsPage = dynamic(
  () => import('@/app/components/settings/SettingsPage'),
  { ssr: false, loading: () => <TabSkeleton /> },
);

interface PageClientProps {
  // 첫 탭이 냉장고일 때 서버에서 렌더링해 스트리밍하는 화면
  fridgeSlot?: React.ReactNode;
  // 서버가 정한 방침 변경 안내 버전 (없으면 null)
  policyNoticeVersion?: string | null;
}

export default function PageClient({
  fridgeSlot,
  policyNoticeVersion,
}: PageClientProps) {
  const searchParams = useSearchParams();
  const activeTab = paramToTab(searchParams.get('tab'));

  const renderContent = () => {
    switch (activeTab) {
      case 'stats':
        return <StatsPage onGoToFridge={() => goToTab('fridge')} />;
      case 'ingredients':
        return (
          <IngredientsBoard
            onGoToFridge={() => goToTab('fridge')}
            onGoToList={() => goToTab('shoppingList')}
          />
        );
      case 'shoppingList':
        return <GroceryListPage />;
      case 'settings':
        return <SettingsPage isOpen={false} onClose={() => {}} />;
      default:
        return fridgeSlot ?? <FridgeBoard />;
    }
  };

  return (
    <FridgeProvider>
      <div className="flex h-screen bg-white">
        <BottomNavigation
          activeTab={activeTab}
          setActiveTab={goToTab}
          onSettingsClick={() => {}}
        />
        <div className="flex-1 overflow-auto bg-[#F0F0F4] p-0 max-md:pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          <div className="mt-0.5">
            <PolicyNoticeBanner noticeVersion={policyNoticeVersion ?? null} />
            {renderContent()}
          </div>
        </div>
      </div>
    </FridgeProvider>
  );
}
