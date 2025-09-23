import React from 'react';
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
    <div className="relative flex w-full justify-center">
      <button
        onClick={onClick}
        className={`relative flex w-11 flex-col items-center p-1 transition-all duration-200 ${
          isActive
            ? 'z-10 rounded-xl bg-[#F3F4F6] text-[#4b2f8c]'
            : 'rounded-xl text-white hover:bg-white/10'
        }`}
        title={item.title}
      >
        <Icon size={22} />
        <span className="mt-0 text-xs">{item.label}</span>
      </button>
    </div>
  );
};

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, setCurrentUser } = useFridge();

  // 네비게이션 아이템 정의
  const navItems: NavItem[] = [
    {
      id: 'fridge',
      icon: Refrigerator,
      label: '냉장고',
      title: '냉장고',
    },
    {
      id: 'foodBenefits',
      icon: BookOpen,
      label: '위키',
      title: '식재료 위키',
    },
    {
      id: 'activity',
      icon: MessageCircleHeart,
      label: '활동',
      title: '활동',
    },
    {
      id: 'assignments',
      icon: HardHat,
      label: '담당자',
      title: '담당자',
    },
  ];

  const userOptions: { id: UserId; name: string }[] = [
    {
      id: 'mom',
      name: '먐무',
    },
    {
      id: 'dad',
      name: '빙빵',
    },
    {
      id: 'bigKid',
      name: '낭농',
    },
    {
      id: 'littleKid',
      name: '떡자',
    },
  ];

  return (
    <div className="flex h-full w-15 flex-col items-center bg-[#4b2f8c] py-4 text-white">
      <div className="mb-4.5">
        <Link href="/">
          <Image
            src="/our-fridge_logo2.png"
            alt="Greenbox Logo"
            width={45}
            height={45}
            className="mx-auto"
          />
        </Link>
      </div>

      <nav className="flex w-full flex-col items-center space-y-3">
        {navItems.map(item => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeTab === item.id}
            onClick={() => setActiveTab(item.id)}
          />
        ))}
      </nav>

      <div className="mt-auto">
        <div className="group relative">
          <button
            className="rounded-full bg-white/10 p-3 transition-colors duration-200 hover:bg-white/20"
            title="사용자 변경"
          >
            <UserIcon size={24} />
          </button>
          <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-32 -translate-x-1/2 transform rounded-md bg-[#F3F4F6] p-2 text-gray-800 opacity-0 shadow-lg transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100">
            <p className="mb-2 text-center text-xs font-medium">현재 사용자</p>
            <select
              value={currentUser as UserId}
              onChange={e => setCurrentUser(e.target.value as UserId)}
              className="w-full rounded border border-gray-300 p-1 text-sm"
            >
              {userOptions.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
