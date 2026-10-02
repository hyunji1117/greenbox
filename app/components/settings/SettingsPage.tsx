'use client';
// app/components/SettingsPage.tsx
// 사용자 설정 페이지 컴포넌트

import React, { useState, useTransition } from 'react';
import {
  Copy,
  User,
  LogOut,
  Users,
  Bell,
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
import { logout, updateFamilyNickname } from '@/app/auth/actions';
import {
  FAMILY_NICKNAME_MAX,
  toDisplayName,
} from '@/app/lib/user/displayName';

interface SettingsPageProps {
  isOpen: boolean;
  onClose: () => void;
}

// --------------------------------------
// 타입 정의
// --------------------------------------
type UserId = 'mom' | 'dad' | 'bigKid' | 'littleKid';
type SettingsSection = 'account' | 'family' | 'notifications' | 'app';

const SettingsPage: React.FC<SettingsPageProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    setCurrentUser,
    myProfile,
    setMyProfile,
    getFamilyMemberName,
  } = useFridge();
  const [nicknameDraft, setNicknameDraft] = useState<string | null>(null);
  const [nicknameMessage, setNicknameMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isLoggingOut, startLoggingOut] = useTransition();
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
  const appVersion = '1.0.0';

  const onSettingsClick = () => {
    console.log('Settings button clicked');
    // 설정을 여는 것 관련 추가 로직 추가 위치
  };

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

  const userOptions: { id: UserId; name: string }[] = (
    ['mom', 'dad', 'bigKid', 'littleKid'] as UserId[]
  ).map(id => ({ id, name: getFamilyMemberName(id) }));

  // 입력 중이 아니면 저장된 호칭을 보여준다
  const nicknameValue = nicknameDraft ?? myProfile?.familyNickname ?? '';
  const isNicknameChanged =
    nicknameDraft !== null &&
    nicknameDraft.trim() !== (myProfile?.familyNickname ?? '');

  const saveNickname = () => {
    if (!myProfile || !isNicknameChanged || isSaving) return;
    setNicknameMessage(null);
    startSaving(async () => {
      const result = await updateFamilyNickname(nicknameValue);
      if ('error' in result) {
        setNicknameMessage({ type: 'error', text: result.error });
        return;
      }
      setMyProfile({ ...myProfile, familyNickname: result.familyNickname });
      setNicknameDraft(null);
      setNicknameMessage({ type: 'success', text: '호칭을 저장했어요' });
    });
  };

  const handleLogout = () => {
    startLoggingOut(async () => {
      await logout();
    });
  };
  if (isOpen) return null;

  return (
    <div className="fixed inset-0 flex justify-end bg-black/50 transition-opacity duration-300">
      <div className="h-full w-full bg-white md:w-2/4 lg:w-1/4">
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4">
          <h2 className="text-xl font-semibold">사용자 설정</h2>
        </div>
        <div className="flex h-[calc(100%-65px)] flex-col md:flex-row">
          {/* Settings navigation */}
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 md:border-r md:border-b-0 md:p-4">
            <nav className="flex gap-2 overflow-x-auto md:block md:space-y-3">
              <button
                onClick={() => setActiveSection('account')}
                className={`flex shrink-0 items-center rounded-xl px-2 py-1 text-left text-sm font-medium whitespace-nowrap ${activeSection === 'account' ? 'bg-[#6B46C1] text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                <User size={18} className="mr-2" />
                계정
              </button>
              <button
                onClick={() => setActiveSection('family')}
                className={`flex shrink-0 items-center rounded-xl px-2 py-1 text-left text-sm font-medium whitespace-nowrap ${activeSection === 'family' ? 'bg-[#6B46C1] text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                <Users size={18} className="mr-2" />
                가족 그룹
              </button>
              <button
                onClick={() => setActiveSection('notifications')}
                className={`flex shrink-0 items-center rounded-xl px-2 py-1 text-left text-sm font-medium whitespace-nowrap ${activeSection === 'notifications' ? 'bg-[#6B46C1] text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                <Bell size={18} className="mr-2" />
                알림 설정
              </button>
              <button
                onClick={() => setActiveSection('app')}
                className={`flex shrink-0 items-center rounded-xl px-2 py-1 text-left text-sm font-medium whitespace-nowrap ${activeSection === 'app' ? 'bg-[#6B46C1] text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                <Info size={18} className="mr-2" />앱 환경
              </button>
            </nav>
          </div>
          {/* Settings content */}
          <div className="flex-1 overflow-y-auto p-4 pb-32 md:w-2/3 md:flex-none md:pb-4">
            {/* Account settings */}
            {activeSection === 'account' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">계정 설정</h3>
                {/* 구글 계정 프로필 */}
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 shadow-sm">
                  {myProfile?.image ? (
                    <Image
                      src={myProfile.image}
                      alt="프로필 사진"
                      width={48}
                      height={48}
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f3edff] text-[#6B46C1]">
                      <User size={22} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-gray-900">
                      {toDisplayName(myProfile) ?? '불러오는 중...'}
                    </div>
                    <div className="truncate text-xs text-gray-500">
                      {myProfile?.familyNickname && myProfile.name
                        ? `${myProfile.name} / `
                        : ''}
                      {myProfile?.email ?? ''}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="family-nickname"
                      className="block text-sm font-medium text-gray-700"
                    >
                      가족 내 호칭
                    </label>
                    <div className="mt-1 flex gap-2">
                      <input
                        id="family-nickname"
                        type="text"
                        maxLength={FAMILY_NICKNAME_MAX}
                        value={nicknameValue}
                        placeholder={myProfile?.name ?? '예: 엄마, 첫째'}
                        disabled={!myProfile || isSaving}
                        onChange={e => {
                          setNicknameDraft(e.target.value);
                          setNicknameMessage(null);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveNickname();
                        }}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 pl-4 text-[#636465] shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-gray-50"
                      />
                      <button
                        type="button"
                        onClick={saveNickname}
                        disabled={!isNicknameChanged || isSaving}
                        className="shrink-0 rounded-xl bg-[#6B46C1] px-4 py-2 text-sm font-medium whitespace-nowrap text-white shadow-sm hover:bg-[#603fad] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSaving ? '저장 중' : '저장'}
                      </button>
                    </div>
                    {nicknameMessage ? (
                      <p
                        className={`mt-1 text-xs ${nicknameMessage.type === 'error' ? 'text-red-500' : 'text-green-600'}`}
                      >
                        {nicknameMessage.text}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-400">
                        호칭을 등록하면 앱에서 구글 이름 대신 호칭으로 보여요
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      이메일
                    </label>
                    <div className="mt-1 flex rounded-xl shadow-sm">
                      <input
                        type="email"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 pl-4 text-[#636465] focus:outline-none"
                        value={myProfile?.email ?? ''}
                        readOnly
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      구글 계정 이메일이라 여기서 바꿀 수 없어요
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="current-user"
                      className="block text-sm font-medium text-gray-700"
                    >
                      현재 사용자
                    </label>
                    <select
                      id="current-user"
                      value={currentUser as UserId}
                      onChange={e => setCurrentUser(e.target.value as UserId)}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 pl-4 text-[#636465] shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {userOptions.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex w-full items-center justify-center rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-50"
                    >
                      <LogOut size={16} className="mr-2" />
                      {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
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
                            src={
                              member.id === currentUser && myProfile?.image
                                ? myProfile.image
                                : member.image
                            }
                            alt={getFamilyMemberName(member.id as FamilyMember)}
                            className="h-10 w-10 rounded-full"
                            width={24}
                            height={24}
                          />
                          <div className="ml-3 flex-1">
                            <div className="font-medium">
                              {getFamilyMemberName(member.id as FamilyMember)}
                            </div>
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

export default SettingsPage;
