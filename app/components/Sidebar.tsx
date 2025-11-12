// app/components/Sidebar.tsx
// 하단 고정 내비게이션 바 컴포넌트

'use client';

import React, { useState } from 'react';
import { useFridge } from '@/app/context/FridgeContext';
import {
  Refrigerator,
  Salad,
  UserIcon,
  LucideIcon,
  NotepadText,
  Cog,
  HeartPulse,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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
      className={`flex shrink-0 grow basis-0 flex-col items-center justify-center py-1 transition-all duration-150 ${
        isActive ? 'text-[#4b2f8c]' : 'text-gray-600'
      }`}
      title={item.title}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon size={22} />
      <span className="mt-0.5 text-[11px] leading-none">{item.label}</span>

      {/* 활성 탭 상단 보더 인디케이터 */}
      <span
        className={`absolute -top-[1px] h-[2px] w-10 rounded-full ${
          isActive ? 'bg-[#4b2f8c]' : 'bg-transparent'
        }`}
        aria-hidden
      />
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
    {
      id: 'healthAnalysis',
      icon: HeartPulse,
      label: 'AI 건강분석',
      title: '건강분석',
    },
    { id: 'fridge', icon: Refrigerator, label: '냉장고', title: '냉장고' },
    {
      id: 'shoppingList',
      icon: NotepadText,
      label: '장보기 리스트',
      title: '장보기 리스트',
    },
    { id: 'ingredients', icon: Salad, label: '식재료', title: '식재료 관리' },
    { id: 'settings', icon: Cog, label: '설정', title: '설정' },
  ];

  const toggleUserSelect = () => setShowUserSelect(v => !v);

  return (
    <>
      {/* 실제 하단 고정 바 */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200/80 bg-white/95 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur supports-[backdrop-filter]:bg-white/80"
        role="navigation"
        aria-label="하단 내비게이션"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)',
        }}
      >
        {/* 상단 로고/홈 */}
        <div className="pointer-events-none absolute -top-10 left-3">
          <Link href="/" className="pointer-events-auto">
            <Image
              src="/our-fridge_logo2.png"
              alt="Our Fridge Logo"
              width={32}
              height={32}
              className="rounded"
              priority
            />
          </Link>
        </div>

        <div className="relative mx-auto flex h-16 max-w-screen-sm items-end justify-between px-2">
          {/* 탭 버튼 */}
          <div className="relative flex h-full w-full items-stretch justify-between">
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
