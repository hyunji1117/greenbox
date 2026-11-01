'use client';
// app/components/SettingsPage.tsx
// 사용자 설정 페이지 컴포넌트

import React, { useState, useTransition } from 'react';
import { User, LogOut } from 'lucide-react';
import { useFridge } from '@/app/context/FridgeContext';
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
type SettingsSection = 'account' | 'app';

const SECTION_TABS = [
  { id: 'account', label: '계정' },
  { id: 'app', label: '앱' },
] as const;

// iOS Safari는 16px 미만 입력창을 누르면 화면을 확대하므로 text-base를 쓴다
const FIELD =
  'h-11 w-full rounded-xl bg-[#F4F4F8] px-3 text-base text-gray-700 focus:ring-1 focus:ring-[#A794D6] focus:outline-none disabled:opacity-60';
const FIELD_LABEL = 'mb-1 block text-xs font-medium text-gray-500';
const DANGER_BUTTON =
  'flex h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50';

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
  const appVersion = '1.0.0';

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
          {activeSection === 'app' && (
            <>
              <div
                className={`flex items-center justify-between p-4 ${SURFACE}`}
              >
                <span className="text-sm font-medium text-gray-800">
                  앱 버전
                </span>
                <span className="text-sm text-gray-500">{appVersion}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
