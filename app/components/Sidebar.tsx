import React from 'react'
import { useFridge } from '@/app/context/FridgeContext'
import { Refrigerator, HardHat, MessageCircleHeart, UserIcon, BookOpen, LucideIcon } from 'lucide-react'

// 사용자 ID 타입 정의
type UserId = 'mom' | 'dad' | 'bigKid' | 'littleKid'

// 네비게이션 아이템 타입 정의
interface NavItem {
  id: string
  icon: LucideIcon
  label: string
  title: string
}

// 네비게이션 버튼 컴포넌트
interface NavButtonProps {
  item: NavItem
  isActive: boolean
  onClick: () => void
}

const NavButton: React.FC<NavButtonProps> = ({ item, isActive, onClick }) => {
  const Icon = item.icon
  
  return (
    <div className="relative w-full flex justify-center">
      <button
        onClick={onClick}
        className={`relative w-16 p-3 flex flex-col items-center transition-all duration-200 ${
          isActive 
            ? 'bg-[#F3F4F6] text-[#4b2f8c] rounded-xl z-10' 
            : 'hover:bg-white/10 text-white rounded-xl'
        }`}
        title={item.title}
      >
        <Icon size={24} />
        <span className="text-xs mt-1">{item.label}</span>
      </button>
    </div>
  )
}

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, setCurrentUser } = useFridge()
  
  // 네비게이션 아이템 정의
  const navItems: NavItem[] = [
    {
      id: 'fridge',
      icon: Refrigerator,
      label: '냉장고',
      title: '냉장고'
    },
    {
      id: 'foodBenefits',
      icon: BookOpen,
      label: '위키',
      title: '식재료 위키'
    },
    {
      id: 'activity',
      icon: MessageCircleHeart,
      label: '활동',
      title: '활동'
    },
    {
      id: 'assignments',
      icon: HardHat,
      label: '담당자',
      title: '담당자'
    }
  ]
  
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
  ]

  return (
    <div className="w-20 bg-[#4b2f8c] text-white flex flex-col items-center py-6 h-full">
      <div className="mb-8">
        <h1 className="font-bold text-lg">냉장고</h1>
      </div>
      
      <nav className="flex flex-col items-center space-y-3 w-full">
        {navItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={activeTab === item.id}
            onClick={() => setActiveTab(item.id)}
          />
        ))}
      </nav>
      
      <div className="mt-auto">
        <div className="relative group">
          <button
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
            title="사용자 변경"
          >
            <UserIcon size={24} />
          </button>
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-[#F3F4F6] text-gray-800 rounded-md shadow-lg p-2 w-32 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200">
            <p className="text-xs text-center mb-2 font-medium">현재 사용자</p>
            <select
              value={currentUser as UserId}
              onChange={(e) => setCurrentUser(e.target.value as UserId)}
              className="w-full text-sm p-1 border border-gray-300 rounded"
            >
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar