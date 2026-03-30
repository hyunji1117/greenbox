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
      className={`flex h-[64px] w-full shrink-0 grow basis-0 flex-col items-center justify-center rounded-3xl px-2 transition-all duration-150 ${
        isActive
          ? 'text-[#4b2f8c]'
          : 'text-[#7b6d99] hover:bg-[#f3edff]/70'
      }`}
      title={item.title}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={25} />
      <span
        className={`mt-2 text-sm leading-none ${
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
      label: '장보기 리스트',
      title: '장보기 리스트',
    },
    {
      id: 'healthAnalysis',
      icon: HeartPulse,
      label: 'AI 건강 분석',
      title: 'AI 건강 분석',
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
        className="fixed bottom-5 left-1/2 z-50 w-[60%] -translate-x-1/2 rounded-3xl bg-[#fbf9ff]/55 shadow-[0_8px_20px_rgba(45,25,90,0.24)] backdrop-blur supports-[backdrop-filter]:bg-[#fbf9ff]/85"
        role="navigation"
        aria-label="하단 내비게이션"
      >
        <div className="relative mx-auto flex h-20 items-center justify-between px-3">
          {/* 탭 버튼 */}
          <div className="relative flex h-full w-full items-center justify-between">
            {/* 활성 탭 배경 슬라이드 인디케이터 */}
            <div
              aria-hidden
              className="absolute left-0 top-[10px] bottom-[12px] rounded-3xl bg-[#e9ddff] shadow-[0_2px_10px_rgba(75,47,140,0.22)] transition-transform duration-300 ease-out"
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
