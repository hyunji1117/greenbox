// app/PageClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import BottomNavigation, {
  Tab,
} from '@/app/components/layout/BottomNavigation';
import FridgeBoard from '@/app/components/fridge/FridgeBoard';
import IngredientsBoard from '@/app/components/ingredients/IngredientsBoard';
import HealthAnalysisPage from '@/app/components/analysis/HealthAnalysisPage';
import GroceryListPage from '@/app/components/grocery-list/GroceryListPage';
import SettingsPage from '@/app/components/settings/SettingsPage';
import { FridgeProvider } from '@/app/context/FridgeContext';
import Loading from '@/app/components/layout/Loading';

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
        <div className="flex-1 overflow-auto bg-[#F0F0F4] p-0">
          <div className="mt-0.5">{renderContent()}</div>
        </div>
      </div>
    </FridgeProvider>
  );
}
