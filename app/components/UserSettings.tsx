import React, { useState } from 'react';
import {
  X,
  Copy,
  User,
  // Mail,
  Lock,
  LogOut,
  Users,
  Bell,
  // Moon,
  Download,
  Trash2,
  Info,
  Plus,
  HelpCircle,
  CopyCheck,
  ChevronDown,
} from 'lucide-react';
import { useFridge, FamilyMember } from '@/app/context/FridgeContext';
import Image from 'next/image';
interface UserSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}
type SettingsSection = 'account' | 'family' | 'notifications' | 'app';
const UserSettings: React.FC<UserSettingsProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useFridge();
  const [activeSection, setActiveSection] =
    useState<SettingsSection>('account');
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    expiryNotifications: true,
    notificationTime: '18:00',
    notificationDays: 3,
    pushEnabled: false,
  });
  // Mock data
  const familyCode = 'FRIDGE123456';
  const familyMembers = [
    {
      id: 'mom',
      name: '먐무',
      role: '관리자',
      image: 'https://i.pravatar.cc/150?img=1',
    },
    {
      id: 'dad',
      name: '빙빵',
      role: '구성원',
      image: 'https://i.pravatar.cc/150?img=2',
    },
    {
      id: 'bigKid',
      name: '낭농',
      role: '구성원',
      image: 'https://i.pravatar.cc/150?img=3',
    },
    {
      id: 'littleKid',
      name: '떡자',
      role: '구성원',
      image: 'https://i.pravatar.cc/150?img=4',
    },
  ];
  const userEmail = 'user@example.com';
  const appVersion = '1.0.0';
  const copyFamilyCode = () => {
    navigator.clipboard.writeText(familyCode);
    setShowCopiedMessage(true);
    setTimeout(() => setShowCopiedMessage(false), 2000);
  };
  const confirmLeaveFamily = () => {
    if (
      window.confirm(
        '정말로 가족 그룹을 나가시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      )
    ) {
      // Handle leaving family logic
      console.log('Left family group');
    }
  };
  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
    // Implement actual dark mode logic here
  };
  const handleNotificationToggle = () => {
    setNotificationSettings({
      ...notificationSettings,
      expiryNotifications: !notificationSettings.expiryNotifications,
    });
  };
  const handleNotificationTimeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setNotificationSettings({
      ...notificationSettings,
      notificationTime: e.target.value,
    });
  };
  const handleNotificationDaysChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setNotificationSettings({
      ...notificationSettings,
      notificationDays: parseInt(e.target.value),
    });
  };
  const clearCache = () => {
    if (window.confirm('캐시를 지우시겠습니까? 앱이 재시작될 수 있습니다.')) {
      // Implement cache clearing logic
      console.log('Cache cleared');
    }
  };
  const getFamilyMemberName = (member: FamilyMember): string => {
    const memberMap = {
      mom: '먐무',
      dad: '빙빵',
      bigKid: '낭농',
      littleKid: '떡자',
    };
    return memberMap[member] || member;
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 transition-opacity duration-300">
      <div className="h-full w-full transform overflow-y-auto bg-white shadow-xl transition-transform duration-300">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
          <h2 className="text-xl font-semibold">사용자 설정</h2>
          <button
            onClick={onClose}
            className="ml-auto text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex h-full">
          {/* Settings navigation */}
          <div className="w-1/4.5 border-r border-gray-200 bg-gray-50 p-4">
            <nav className="space-y-3">
              <button
                onClick={() => setActiveSection('account')}
                className={`flex items-center rounded-xl px-2 py-1 text-left text-sm font-medium ${activeSection === 'account' ? 'bg-[#6B46C1] text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                <User size={18} className="mr-2" />
                계정
              </button>
              <button
                onClick={() => setActiveSection('family')}
                className={`flex items-center rounded-xl px-2 py-1 text-left text-sm font-medium ${activeSection === 'family' ? 'bg-[#6B46C1] text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                <Users size={18} className="mr-2" />
                가족 그룹
              </button>
              <button
                onClick={() => setActiveSection('notifications')}
                className={`flex items-center rounded-xl px-2 py-1 text-left text-sm font-medium ${activeSection === 'notifications' ? 'bg-[#6B46C1] text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                <Bell size={18} className="mr-2" />
                알림 설정
              </button>
              <button
                onClick={() => setActiveSection('app')}
                className={`flex items-center rounded-xl px-2 py-1 text-left text-sm font-medium ${activeSection === 'app' ? 'bg-[#6B46C1] text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                <Info size={18} className="mr-2" />앱 환경
              </button>
            </nav>
          </div>
          {/* Settings content */}
          <div className="w-2/3 p-4">
            {/* Account settings */}
            {activeSection === 'account' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">계정 설정</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      가족 내 호칭
                    </label>
                    <div className="mt-1 flex rounded-xl shadow-sm">
                      <input
                        type="text"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 pl-4 text-[#636465] focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        defaultValue={getFamilyMemberName(currentUser)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      이메일
                    </label>
                    <div className="mt-1 flex rounded-xl shadow-sm">
                      <input
                        type="email"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 pl-4 text-[#636465] focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        defaultValue={userEmail}
                      />
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      <Lock size={16} className="mr-2" />
                      비밀번호 변경
                    </button>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="flex w-full items-center justify-center rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
                    >
                      <LogOut size={16} className="mr-2" />
                      로그아웃
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Family group settings */}
            {activeSection === 'family' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  가족 그룹 설정
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      가족 코드
                    </label>
                    <div className="mt-1 flex rounded-xl">
                      <input
                        type="text"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 pl-4 text-[#636465] shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={familyCode}
                        readOnly
                      />
                      <button
                        type="button"
                        onClick={copyFamilyCode}
                        className="ml-2 inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        {showCopiedMessage ? (
                          <CopyCheck size={16} className="text-green-500" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                    {showCopiedMessage && (
                      <p className="mt-1 text-xs text-green-600">
                        코드가 복사되었습니다!
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      가족 구성원
                    </label>
                    <div className="mt-2 space-y-3">
                      {familyMembers.map(member => (
                        <div
                          key={member.id}
                          className="flex items-center rounded-xl border border-gray-200 p-3 shadow-sm"
                        >
                          <Image
                            src={member.image}
                            alt={member.name}
                            className="h-10 w-10 rounded-full"
                            width={24}
                            height={24}
                          />
                          <div className="ml-3 flex-1">
                            <div className="font-medium">{member.name}</div>
                            <div className="text-xs text-gray-500">
                              {member.role}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      <Plus size={16} className="mr-2" />
                      초대하기
                    </button>
                    <button
                      type="button"
                      onClick={confirmLeaveFamily}
                      className="flex flex-1 items-center justify-center rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
                    >
                      <LogOut size={16} className="mr-2" />
                      가족 나가기
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Notification settings */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">알림 설정</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-700">
                        유통기한 임박 알림
                      </span>
                      <HelpCircle size={16} className="ml-1 text-gray-400" />
                    </div>
                    <button
                      type="button"
                      onClick={handleNotificationToggle}
                      className={`h-5.9 relative inline-flex w-[43px] flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent shadow-sm transition-colors duration-200 ease-in-out focus:outline-none ${notificationSettings.expiryNotifications ? 'bg-[#4b2f8c]' : 'bg-gray-200'}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notificationSettings.expiryNotifications ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      알림 시간
                    </label>
                    <div className="mt-1">
                      <input
                        type="time"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 pl-4 text-[#636465] shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={notificationSettings.notificationTime}
                        onChange={handleNotificationTimeChange}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      알림 기준일
                    </label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none rounded-xl border border-gray-200 px-3 py-2 pl-4 text-[#636465] shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={notificationSettings.notificationDays}
                        onChange={handleNotificationDaysChange}
                      >
                        <option value={1}>1일 전</option>
                        <option value={3}>3일 전</option>
                        <option value={7}>7일 전</option>
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[#636465]"
                        strokeWidth={1.5}
                        width={18}
                        height={18}
                      />
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Bell size={20} className="text-gray-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-800">
                          푸시 알림 권한
                        </h3>
                        <div className="mt-2 text-sm text-gray-700">
                          <p>
                            푸시 알림 권한이{' '}
                            {notificationSettings.pushEnabled
                              ? '활성화'
                              : '비활성화'}{' '}
                            되어 있습니다.
                          </p>
                        </div>
                        {!notificationSettings.pushEnabled && (
                          <div className="mt-4">
                            <button
                              type="button"
                              className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                              권한 요청하기
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* App environment settings */}
            {activeSection === 'app' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  앱 환경 설정
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      다크 모드
                    </span>
                    <button
                      type="button"
                      onClick={handleDarkModeToggle}
                      className={`h-5.9 relative inline-flex w-[43px] flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${darkMode ? 'bg-[#4b2f8c]' : 'bg-gray-200'}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${darkMode ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Download size={20} className="text-gray-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-gray-800">
                          앱 설치하기
                        </h3>
                        <div className="mt-2 text-sm text-gray-700">
                          <p>홈 화면에 추가하여 앱처럼 사용할 수 있습니다.</p>
                        </div>
                        <div className="mt-4">
                          <button
                            type="button"
                            className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                          >
                            설치 방법 보기
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        앱 버전
                      </span>
                      <span className="text-sm text-gray-500">
                        {appVersion}
                      </span>
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={clearCache}
                      className="flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                    >
                      <Trash2 size={16} className="mr-2" />
                      캐시 삭제
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default UserSettings;
