// app/components/layout/BottomNavigation.tsx
// 하단 고정 내비게이션 바 컴포넌트

'use client';

import React, { useState } from 'react';
import { useFridge } from '@/app/context/FridgeContext';
import {
  Refrigerator,
  House,
  ShoppingBasket,
  LucideIcon,
  HeartPulse,
  UserRound,
} from 'lucide-react';

// --------------------------------------
// 공통 Tab 타입
// --------------------------------------
export type Tab =
  | 'healthAnalysis'
  | 'fridge'
  | 'shoppingList'
  | 'ingredients'
  | 'settings';

interface NavItem {
  id: Tab;
  icon: LucideIcon;
  label: string;
  title: string;
}

interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

interface BottomBarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  onSettingsClick: () => void;
}

// --------------------------------------
// NavButton 컴포넌트
// --------------------------------------
const NavButton: React.FC<NavButtonProps> = ({ item, isActive, onClick }) => {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className={`flex h-[64px] max-[500px]:h-[54px] max-[353px]:h-[48px] w-full shrink-0 grow basis-0 flex-col items-center justify-center rounded-3xl px-2 max-[500px]:px-1 max-[353px]:px-0.5 transition-all duration-150 ${
        isActive
          ? 'text-[#4b2f8c]'
          : 'text-[#7b6d99] hover:bg-[#f3edff]/70'
      }`}
      title={item.title}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon
        className="h-[25px] w-[25px] shrink-0 max-[500px]:h-5 max-[500px]:w-5 max-[353px]:h-[18px] max-[353px]:w-[18px]"
        aria-hidden
      />
      <span
        className={`mt-2 max-[500px]:mt-1 max-[353px]:mt-0.5 text-sm max-[500px]:text-xs max-[353px]:text-[11px] leading-none max-[353px]:leading-tight ${
          isActive ? 'font-semibold' : 'font-normal'
        }`}
      >
        {item.label}
      </span>
    </button>
  );
};

// --------------------------------------
// BottomBar (메인 내비게이션 컴포넌트)
// --------------------------------------
const BottomBar: React.FC<BottomBarProps> = ({
  activeTab,
  setActiveTab,
  onSettingsClick,
}) => {
  const { currentUser, setCurrentUser } = useFridge();
  const [showUserSelect, setShowUserSelect] = useState(false);

  // 네비게이션 아이템 정의 (Tab 타입 사용)
  const navItems: NavItem[] = [
    // { id: 'activity', icon: MessageCircleHeart, label: '활동', title: '활동' },
    { id: 'ingredients', icon: House, label: '홈', title: 'Home' },
    { id: 'fridge', icon: Refrigerator, label: '냉장고', title: '냉장고' },
    {
      id: 'shoppingList',
      icon: ShoppingBasket,
      label: '리스트',
      title: '리스트',
    },
    {
      id: 'healthAnalysis',
      icon: HeartPulse,
      label: '건강',
      title: '건강',
    },
    { id: 'settings', icon: UserRound, label: '마이', title: 'My' },
  ];

  const toggleUserSelect = () => setShowUserSelect(v => !v);
  const activeIndex = Math.max(
    0,
    navItems.findIndex(item => item.id === activeTab),
  );

  return (
    <>
      {/* 실제 하단 고정 바 */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 w-full rounded-t-3xl border-t border-[#d7c9f5]/50 bg-[#fbf9ff]/95 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-8px_24px_rgba(45,25,90,0.14)] backdrop-blur supports-[backdrop-filter]:bg-[#fbf9ff]/90 md:inset-x-auto md:bottom-5 md:left-1/2 md:w-[60%] md:-translate-x-1/2 md:rounded-3xl md:border-0 md:bg-[#fbf9ff]/55 md:pb-0 md:shadow-[0_8px_20px_rgba(45,25,90,0.24)] md:supports-[backdrop-filter]:bg-[#fbf9ff]/85"
        role="navigation"
        aria-label="하단 내비게이션"
      >
        <div className="relative mx-auto flex h-20 max-[500px]:h-[68px] max-[353px]:h-[60px] items-center justify-between px-3 max-[500px]:px-2 max-[353px]:px-1">
          {/* 탭 버튼 */}
          <div className="relative flex h-full w-full items-center justify-between">
            {/* 활성 탭 배경 슬라이드 인디케이터 */}
            <div
              aria-hidden
              className="absolute left-0 top-[10px] bottom-[12px] max-[500px]:top-2 max-[500px]:bottom-2 max-[353px]:top-1.5 max-[353px]:bottom-1.5 rounded-3xl bg-[#e9ddff] shadow-[0_2px_10px_rgba(75,47,140,0.22)] transition-transform duration-300 ease-out"
              style={{
                width: `${100 / navItems.length}%`,
                transform: `translateX(${activeIndex * 100}%)`,
              }}
            />

            {navItems.map(item => (
              <div
                key={item.id}
                className="relative flex h-full flex-1 items-center justify-center"
              >
                <NavButton
                  item={item}
                  isActive={activeTab === item.id}
                  onClick={() => setActiveTab(item.id)}
                />
              </div>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
};

export default BottomBar;
