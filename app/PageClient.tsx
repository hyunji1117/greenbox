// app/PageClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import BottomNavigation, {
  Tab,
} from '@/app/components/layout/BottomNavigation';
import { FridgeProvider } from '@/app/context/FridgeContext';
import Loading from '@/app/components/layout/Loading';

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
        <div
          key={i}
          className="h-40 animate-pulse rounded-xl bg-gray-200"
        />
      ))}
    </div>
  </div>
);

// 각 탭을 동적 import로 분리 → 해당 탭을 열 때만 청크 로드.
// recharts를 쓰는 HealthAnalysisPage(363KB)가 메인 첫 로드에서 빠지는 게 핵심.
// 전부 클라이언트 전용 화면이라 ssr: false.
const FridgeBoard = dynamic(
  () => import('@/app/components/fridge/FridgeBoard'),
  { ssr: false, loading: () => <TabSkeleton /> },
);
const IngredientsBoard = dynamic(
  () => import('@/app/components/ingredients/IngredientsBoard'),
  { ssr: false, loading: () => <TabSkeleton /> },
);
const HealthAnalysisPage = dynamic(
  () => import('@/app/components/analysis/HealthAnalysisPage'),
  { ssr: false, loading: () => <TabSkeleton /> },
);
const GroceryListPage = dynamic(
  () => import('@/app/components/grocery-list/GroceryListPage'),
  { ssr: false, loading: () => <TabSkeleton /> },
);
const SettingsPage = dynamic(
  () => import('@/app/components/settings/SettingsPage'),
  { ssr: false, loading: () => <TabSkeleton /> },
);

import purchaseStorage from '@/app/lib/storage/PurchaseDataStorage';
import shoppingListStorage from '@/app/lib/storage/ShoppingListStorage';

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

export default function PageClient() {
  const [bootProgress, setBootProgress] = useState(0);
  const [bootDone, setBootDone] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<Tab>(
    paramToTab(searchParams.get('tab')),
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 실제 비동기 작업들을 Promise 배열로 관리
  useEffect(() => {
    const initPurchaseStorage = purchaseStorage.init().catch(err => {
      console.error('purchaseStorage init failed', err);
    });

    const preloadGroceryData = Promise.resolve().then(() => {
      shoppingListStorage.loadShoppingList();
      shoppingListStorage.loadFavorites();
    });

    const tasks: Promise<unknown>[] = [initPurchaseStorage, preloadGroceryData];

    tasks.forEach(promise => {
      promise.then(() => {
        setBootProgress(prev => {
          const next = prev + 100 / tasks.length;
          return next > 100 ? 100 : next;
        });
      });
    });

    Promise.all(tasks).then(() => {
      setBootProgress(100);
      setTimeout(() => setBootDone(true), 300);
    });
  }, []);

  // URL 변경 → activeTab 동기화 (부팅 완료 후에만)
  useEffect(() => {
    if (!bootDone) return;
    setActiveTab(paramToTab(searchParams.get('tab')));
  }, [searchParams, bootDone]);

  const handleTabChange = (tab: Tab) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('tab', tab);
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
    setActiveTab(tab);
  };

  const closeSettings = () => setIsSettingsOpen(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'healthAnalysis':
        return <HealthAnalysisPage />;
      case 'fridge':
        return <FridgeBoard />;
      case 'ingredients':
        return <IngredientsBoard />;
      case 'shoppingList':
        return <GroceryListPage />;
      case 'settings':
        return <SettingsPage isOpen={isSettingsOpen} onClose={closeSettings} />;
      default:
        return <FridgeBoard />;
    }
  };

  // 부팅 중이면 로딩 화면
  if (!bootDone) {
    return <Loading progress={bootProgress} />;
  }

  // 부팅 완료 후 메인 UI
  return (
    <FridgeProvider>
      <div className="flex h-screen bg-white">
        <BottomNavigation
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          onSettingsClick={() => {}}
        />
        <div className="flex-1 overflow-auto bg-[#F0F0F4] p-0 max-md:pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          <div className="mt-0.5">{renderContent()}</div>
        </div>
      </div>
    </FridgeProvider>
  );
}
