'use client';

import React, { useState } from 'react';
import { useFridge } from '@/app/context/FridgeContext';
import {
  Refrigerator,
  HardHat,
  MessageCircleHeart,
  UserIcon,
  BookOpen,
  LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// 사용자 ID 타입 정의
type UserId = 'mom' | 'dad' | 'bigKid' | 'littleKid';

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  title: string;
}

interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ item, isActive, onClick }) => {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 grow basis-0 flex-col items-center justify-center py-1 transition-all duration-150 ${isActive ? 'text-[#4b2f8c]' : 'text-gray-600'} `}
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

interface BottomBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSettingsClick: () => void; // 필요시 유지
}

const BottomBar: React.FC<BottomBarProps> = ({
  activeTab,
  setActiveTab,
  onSettingsClick,
}) => {
  const { currentUser, setCurrentUser } = useFridge();
  const [showUserSelect, setShowUserSelect] = useState(false);

  // 네비게이션 아이템 정의
  const navItems: NavItem[] = [
    { id: 'fridge', icon: Refrigerator, label: '냉장고', title: '냉장고' },
    { id: 'foodBenefits', icon: BookOpen, label: '위키', title: '식재료 위키' },
    { id: 'activity', icon: MessageCircleHeart, label: '활동', title: '활동' },
    { id: 'assignments', icon: HardHat, label: '담당자', title: '담당자' },
  ];

  const userOptions: { id: UserId; name: string }[] = [
    { id: 'mom', name: '먐무' },
    { id: 'dad', name: '빙빵' },
    { id: 'bigKid', name: '낭농' },
    { id: 'littleKid', name: '떡자' },
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
        <div className="relative mx-auto flex h-16 max-w-screen-sm items-end justify-between px-2">
          {/* 탭들 */}
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

          {/* 사용자 버튼 */}
          <div className="absolute top-2 right-1">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4b2f8c] text-white shadow-md transition hover:opacity-90"
              title="사용자 전환"
              aria-haspopup="listbox"
              aria-expanded={showUserSelect}
              onClick={toggleUserSelect}
            >
              <UserIcon size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* 사용자 선택 팝오버 */}
      {showUserSelect && (
        <div
          className="fixed right-3 bottom-[76px] z-[60] w-40 rounded-xl border border-gray-200 bg-white p-2 shadow-xl"
          role="dialog"
          aria-label="현재 사용자 선택"
        >
          <p className="mb-2 text-center text-xs font-medium text-gray-600">
            현재 사용자
          </p>
          <select
            value={currentUser as UserId}
            onChange={e => setCurrentUser(e.target.value as UserId)}
            className="w-full rounded-md border border-gray-300 bg-white p-1.5 text-sm"
            aria-label="사용자 선택"
          >
            {userOptions.map(user => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>

          {/* (선택) 설정 페이지 버튼 유지하고 싶으면 사용 */}
          <button
            onClick={onSettingsClick}
            className="mt-2 w-full rounded-md bg-gray-100 py-1.5 text-center text-xs text-gray-700 transition hover:bg-gray-200"
          >
            설정 열기
          </button>
        </div>
      )}
    </>
  );
};

export default BottomBar;
