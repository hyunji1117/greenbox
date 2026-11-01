'use client';
// app/components/SettingsPage.tsx
// 사용자 설정 페이지 컴포넌트

import React, { useState, useTransition } from 'react';
import {
  Copy,
  User,
  LogOut,
  Bell,
  Download,
  Trash2,
  Plus,
  HelpCircle,
  CopyCheck,
  ChevronDown,
} from 'lucide-react';
import { useFridge, FamilyMember } from '@/app/context/FridgeContext';
import Image from 'next/image';
import SegmentedTabs, { SURFACE } from '@/app/components/common/SegmentedTabs';
import { logout, updateFamilyNickname } from '@/app/auth/actions';
import { FAMILY_NICKNAME_MAX, toDisplayName } from '@/app/lib/user/displayName';

interface SettingsPageProps {
  isOpen: boolean;
  onClose: () => void;
}

// --------------------------------------
// 타입 정의
// --------------------------------------
type UserId = 'mom' | 'dad' | 'bigKid' | 'littleKid';
type SettingsSection = 'account' | 'family' | 'notifications' | 'app';

const SECTION_TABS = [
  { id: 'account', label: '계정' },
  { id: 'family', label: '가족' },
  { id: 'notifications', label: '알림' },
  { id: 'app', label: '앱' },
] as const;

// iOS Safari는 16px 미만 입력창을 누르면 화면을 확대하므로 text-base를 쓴다
const FIELD =
  'h-11 w-full rounded-xl bg-[#F4F4F8] px-3 text-base text-gray-700 focus:ring-1 focus:ring-[#A794D6] focus:outline-none disabled:opacity-60';
const FIELD_LABEL = 'mb-1 block text-xs font-medium text-gray-500';
const SECONDARY_BUTTON =
  'flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#F4F4F8] px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200';
const DANGER_BUTTON =
  'flex h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-label={label}
    aria-checked={checked}
    onClick={onChange}
    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 motion-reduce:transition-none ${checked ? 'bg-[#6B46C1]' : 'bg-gray-300'}`}
  >
    <span
      className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 motion-reduce:transition-none ${checked ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
);

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
      <div className="flex h-full w-full flex-col overflow-y-auto bg-[#F2F2F6] p-4 pb-32 md:w-2/4 lg:w-1/3">
        <h1 className="mb-4 text-xl font-semibold">마이</h1>
        <SegmentedTabs
          tabs={SECTION_TABS}
          activeId={activeSection}
          onChange={setActiveSection}
          className="mb-4"
        />
        <div
          key={activeSection}
          className="motion-safe:animate-tab-fade space-y-3"
        >
          {activeSection === 'account' && (
            <>
              <div className={`flex items-center gap-3 p-4 ${SURFACE}`}>
                {myProfile?.image ? (
                  <Image
                    src={myProfile.image}
                    alt="프로필 사진"
                    width={48}
                    height={48}
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F1EDFA] text-[#6B46C1]">
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
              <div className={`space-y-4 p-4 ${SURFACE}`}>
                <div>
                  <label htmlFor="family-nickname" className={FIELD_LABEL}>
                    가족 내 호칭
                  </label>
                  <div className="flex gap-2">
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
                      className={`${FIELD} min-w-0`}
                    />
                    <button
                      type="button"
                      onClick={saveNickname}
                      disabled={!isNicknameChanged || isSaving}
                      className="h-11 shrink-0 rounded-xl bg-[#6B46C1] px-4 text-sm font-semibold whitespace-nowrap text-white transition-colors hover:bg-[#603fad] disabled:bg-[#F1EDFA] disabled:text-[#A794D6]"
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
                  <label htmlFor="account-email" className={FIELD_LABEL}>
                    이메일
                  </label>
                  <input
                    id="account-email"
                    type="email"
                    className={FIELD}
                    value={myProfile?.email ?? ''}
                    readOnly
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    구글 계정 이메일이라 여기서 바꿀 수 없어요
                  </p>
                </div>
                <div>
                  <label htmlFor="current-user" className={FIELD_LABEL}>
                    현재 사용자
                  </label>
                  <select
                    id="current-user"
                    value={currentUser as UserId}
                    onChange={e => setCurrentUser(e.target.value as UserId)}
                    className={FIELD}
                  >
                    {userOptions.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`${DANGER_BUTTON} w-full`}
              >
                <LogOut size={16} />
                {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
              </button>
            </>
          )}
          {activeSection === 'family' && (
            <>
              <div className={`p-4 ${SURFACE}`}>
                <label htmlFor="family-code" className={FIELD_LABEL}>
                  가족 코드
                </label>
                <div className="flex gap-2">
                  <input
                    id="family-code"
                    type="text"
                    className={`${FIELD} min-w-0`}
                    value={familyCode}
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={copyFamilyCode}
                    aria-label="가족 코드 복사"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F4F4F8] text-gray-700 transition-colors hover:bg-gray-200"
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
              <div className={`p-4 ${SURFACE}`}>
                <h2 className={FIELD_LABEL}>가족 구성원</h2>
                <ul className="divide-y divide-gray-100">
                  {familyMembers.map(member => (
                    <li key={member.id} className="flex items-center py-2.5">
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
                      <div className="ml-3 min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-gray-800">
                          {getFamilyMemberName(member.id as FamilyMember)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {member.role}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className={SECONDARY_BUTTON}>
                  <Plus size={16} />
                  초대하기
                </button>
                <button
                  type="button"
                  onClick={confirmLeaveFamily}
                  className={DANGER_BUTTON}
                >
                  <LogOut size={16} />
                  가족 나가기
                </button>
              </div>
            </>
          )}
          {activeSection === 'notifications' && (
            <>
              <div className={`space-y-4 p-4 ${SURFACE}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center text-sm font-medium text-gray-800">
                    유통기한 임박 알림
                    <HelpCircle size={16} className="ml-1 text-gray-400" />
                  </div>
                  <Toggle
                    label="유통기한 임박 알림"
                    checked={notificationSettings.expiryNotifications}
                    onChange={handleNotificationToggle}
                  />
                </div>
                <div>
                  <label htmlFor="notification-time" className={FIELD_LABEL}>
                    알림 시간
                  </label>
                  <input
                    id="notification-time"
                    type="time"
                    className={FIELD}
                    value={notificationSettings.notificationTime}
                    onChange={handleNotificationTimeChange}
                  />
                </div>
                <div>
                  <label htmlFor="notification-days" className={FIELD_LABEL}>
                    알림 기준일
                  </label>
                  <div className="relative">
                    <select
                      id="notification-days"
                      className={`${FIELD} appearance-none`}
                      value={notificationSettings.notificationDays}
                      onChange={handleNotificationDaysChange}
                    >
                      <option value={1}>1일 전</option>
                      <option value={3}>3일 전</option>
                      <option value={7}>7일 전</option>
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
                      strokeWidth={1.5}
                      width={18}
                      height={18}
                    />
                  </div>
                </div>
              </div>
              <div className={`flex gap-3 p-4 ${SURFACE}`}>
                <Bell size={20} className="mt-0.5 shrink-0 text-[#6B46C1]" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold text-gray-800">
                    푸시 알림 권한
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    푸시 알림 권한이{' '}
                    {notificationSettings.pushEnabled ? '활성화' : '비활성화'}{' '}
                    되어 있습니다.
                  </p>
                  {!notificationSettings.pushEnabled && (
                    <button
                      type="button"
                      className={`${SECONDARY_BUTTON} mt-3`}
                    >
                      권한 요청하기
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
          {activeSection === 'app' && (
            <>
              <div className={`p-4 ${SURFACE}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-gray-800">
                    다크 모드
                  </span>
                  <Toggle
                    label="다크 모드"
                    checked={darkMode}
                    onChange={handleDarkModeToggle}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                  <span className="text-sm font-medium text-gray-800">
                    앱 버전
                  </span>
                  <span className="text-sm text-gray-500">{appVersion}</span>
                </div>
              </div>
              <div className={`flex gap-3 p-4 ${SURFACE}`}>
                <Download
                  size={20}
                  className="mt-0.5 shrink-0 text-[#6B46C1]"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold text-gray-800">
                    앱 설치하기
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    홈 화면에 추가하여 앱처럼 사용할 수 있습니다.
                  </p>
                  <button type="button" className={`${SECONDARY_BUTTON} mt-3`}>
                    설치 방법 보기
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={clearCache}
                className={`${SECONDARY_BUTTON} w-full`}
              >
                <Trash2 size={16} />
                캐시 삭제
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
