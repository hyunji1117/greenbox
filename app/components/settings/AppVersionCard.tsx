'use client';
// app/components/settings/AppVersionCard.tsx
// 앱 버전 표시. 테스트 계정(greenboxtest7)에서만 버전을 5번 연달아 누르면 개발자 영역
// (테스트 기기 표시, 테스트 알림, 가이드 테스트)이 나오고, 다시 5번 누르면 숨긴다
// 다른 계정은 5번 눌러도 아무 일이 없다. 다른 계정으로 마이를 열면 이 기기의 테스트 기기 표시와 가이드 테스트를 끈다
// (테스트 설정은 테스트 계정에만 적용한다). 켠 기기에서는 숨기기 전까지 계속 보여 준다

import React, {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import InternalDeviceToggle from '@/app/components/settings/InternalDeviceToggle';
import TestPushCard from '@/app/components/settings/TestPushCard';
import GuideTestCard from '@/app/components/settings/GuideTestCard';
import {
  isInternalDevice,
  setGuideTestMode,
  setInternalDevice,
} from '@/app/lib/analytics/gtag';
import { isGuideTestOn } from '@/app/lib/testing/guideTest';
import { appVersionLabel } from '@/app/lib/app/version';

export const REVEAL_TAPS = 5;
// 이 시간 안에 이어서 눌러야 센다
const TAP_WINDOW_MS = 2000;

// 켠 기기에서 스위치를 숨겨 둔 기록. 다시 5번 누르기 전까지 숨긴다
export const TOGGLE_HIDDEN_KEY = 'greenbox_internal_toggle_hidden';

const subscribe = () => () => {};

function readHidden(): boolean {
  try {
    return localStorage.getItem(TOGGLE_HIDDEN_KEY) === '1';
  } catch {
    return false;
  }
}

function saveHidden(hidden: boolean): void {
  try {
    if (hidden) localStorage.setItem(TOGGLE_HIDDEN_KEY, '1');
    else localStorage.removeItem(TOGGLE_HIDDEN_KEY);
  } catch {
    // 저장하지 못해도 지금 화면에서는 바꾼다
  }
}

// isTestAccount: 테스트 계정인지. 내 정보를 불러오는 중이면 undefined (그동안은 아무것도 끄지 않는다)
const AppVersionCard: React.FC<{ isTestAccount?: boolean }> = ({
  isTestAccount,
}) => {
  const isInternal = useSyncExternalStore(
    subscribe,
    isInternalDevice,
    () => false,
  );
  const isHidden = useSyncExternalStore(subscribe, readHidden, () => false);
  // 5번 눌러 직접 바꾼 값. 없으면 켠 기기인지와 숨긴 기록을 따른다
  const [override, setOverride] = useState<boolean | null>(null);
  const isVisible =
    isTestAccount === true && (override ?? (isInternal && !isHidden));
  const taps = useRef<number[]>([]);

  useEffect(() => {
    if (isTestAccount !== false) return;
    if (isInternalDevice()) setInternalDevice(false);
    if (isGuideTestOn()) setGuideTestMode(false);
  }, [isTestAccount]);

  const countTap = () => {
    if (!isTestAccount) return;
    const now = Date.now();
    taps.current = [...taps.current.filter(t => now - t < TAP_WINDOW_MS), now];
    if (taps.current.length < REVEAL_TAPS) return;
    taps.current = [];
    setOverride(!isVisible);
    saveHidden(isVisible);
  };

  return (
    <>
      {/* 버튼 모양을 드러내지 않는 숨은 동작이라 스크린 리더에는 일반 글로 읽힌다 */}
      <div
        onClick={countTap}
        className={`flex items-center justify-between p-4 select-none ${SURFACE}`}
      >
        <span className="text-sm font-medium text-gray-800">앱 버전</span>
        <span className="text-sm text-gray-500 tabular-nums">
          {appVersionLabel(isVisible)}
        </span>
      </div>
      {isVisible && <InternalDeviceToggle />}
      {isVisible && <TestPushCard />}
      {isVisible && <GuideTestCard />}
    </>
  );
};

export default AppVersionCard;
