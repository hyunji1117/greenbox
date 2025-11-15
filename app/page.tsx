// app/page.tsx
// 메인 페이지 컴포넌트

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import BottomNavigation, {
  Tab,
} from '@/app/components/layout/BottomNavigation';
import FridgeBoard from '@/app/components/FridgeBoard';
import IngredientsBoard from '@/app/components/IngredientsBoard';
import HealthAnalysisPage from '@/app/components/HealthAnalysisPage';
// import ActivityFeed from '@/app/components/ActivityFeed';
import ShoppingListPage from '@/app/components/ShoppingListPage';
import SettingsPage from '@/app/components/SettingsPage';
import { FridgeProvider } from '@/app/context/FridgeContext';

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL 쿼리 기반으로 탭 상태 파싱
  const paramToTab = (v: string | null): Tab => {
    switch (v) {
      case 'healthAnalysis':
      case 'fridge':
      case 'shoppingList':
      case 'ingredients':
      case 'settings':
        return v;
      default:
        return 'fridge';
    }
  };

  // 초기 탭 상태
  const [activeTab, setActiveTab] = useState<Tab>(
    paramToTab(searchParams.get('tab')),
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // URL 변경 → activeTab 동기화
  useEffect(() => {
    setActiveTab(paramToTab(searchParams.get('tab')));
  }, [searchParams]);

  // 탭 클릭 시 URL 쿼리 갱신
  const handleTabChange = (tab: Tab) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('tab', tab);
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
    setActiveTab(tab);
  };

  // const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);

  // 각 탭별 렌더링 분기
  const renderContent = () => {
    switch (activeTab) {
      case 'healthAnalysis':
        return <HealthAnalysisPage />;
      case 'fridge':
        return <FridgeBoard />;
      case 'ingredients':
        return <IngredientsBoard />;
      case 'shoppingList':
        return <ShoppingListPage />;
      case 'settings':
        return <SettingsPage isOpen={isSettingsOpen} onClose={closeSettings} />;
      default:
        return <FridgeBoard />;
    }
  };

  return (
    <FridgeProvider>
      <div className="flex h-screen bg-white">
        {/* 하단 내비게이션 */}
        <BottomNavigation
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onSettingsClick={() => {}}
        />

        {/* 메인 콘텐츠 */}
        <div className="flex-1 overflow-auto bg-[#F0F0F4] p-0">
          <div className="mt-0.5">{renderContent()}</div>
        </div>
      </div>
    </FridgeProvider>
  );
}
