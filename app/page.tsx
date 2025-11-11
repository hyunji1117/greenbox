// app/page.tsx
'use client';

import React, { useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import FridgeBoard from '@/app/components/FridgeBoard';
import AssignmentBoard from '@/app/components/AssignmentBoard';
import ActivityFeed from '@/app/components/ActivityFeed';
import FoodBenefitsBoard from '@/app/components/FoodBenefitsBoard';
import UserSettings from '@/app/components/UserSettings';
import { FridgeProvider } from '@/app/context/FridgeContext';

// 중요: default export로 변경
export default function Page() {
  const [activeTab, setActiveTab] = useState('fridge');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const openSettings = () => {
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'fridge':
        return <FridgeBoard />;
      case 'foodBenefits':
        return <FoodBenefitsBoard />;
      case 'activity':
        return <ActivityFeed />;
      case 'assignments':
        return <AssignmentBoard />;
      default:
        return <FridgeBoard />;
    }
  };

  // const getTabTitle = () => {
  //   switch (activeTab) {
  //     case 'fridge':
  //       return '우리 냉장고';
  //     case 'foodBenefits':
  //       return '식재료 위키';
  //     case 'activity':
  //       return '활동 기록';
  //     case 'assignments':
  //       return '담당자 관리';
  //     default:
  //       return '우리 냉장고';
  //   }
  // };

  return (
    <FridgeProvider>
      <div className="flex h-screen bg-white">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSettingsClick={openSettings}
        />
        <div className="flex-1 overflow-auto bg-[#F0F0F4] p-0">
          <div className="mt-0.5">{renderContent()}</div>
        </div>
        <UserSettings isOpen={isSettingsOpen} onClose={closeSettings} />
      </div>
    </FridgeProvider>
  );
}
