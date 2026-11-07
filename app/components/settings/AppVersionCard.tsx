'use client';
// app/components/settings/AppVersionCard.tsx
// 앱 버전 표시. 버전을 5번 연달아 누르면 개발자용 "테스트 기기로 표시" 스위치가 나온다
// 일반 사용자에게는 통계용 스위치와 배포 커밋이 보이지 않게 숨기고, 이미 켠 기기에서는 계속 보여 준다

import React, { useRef, useState, useSyncExternalStore } from 'react';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import InternalDeviceToggle from '@/app/components/settings/InternalDeviceToggle';
import { isInternalDevice } from '@/app/lib/analytics/gtag';
import { appVersionLabel } from '@/app/lib/app/version';

export const REVEAL_TAPS = 5;
// 이 시간 안에 이어서 눌러야 센다
const TAP_WINDOW_MS = 2000;

const subscribe = () => () => {};

const AppVersionCard: React.FC = () => {
  const isInternal = useSyncExternalStore(
    subscribe,
    isInternalDevice,
    () => false,
  );
  const [isRevealed, setIsRevealed] = useState(false);
  const taps = useRef<number[]>([]);

  const countTap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter(t => now - t < TAP_WINDOW_MS), now];
    if (taps.current.length >= REVEAL_TAPS) setIsRevealed(true);
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
          {appVersionLabel(isRevealed || isInternal)}
        </span>
      </div>
      {(isRevealed || isInternal) && <InternalDeviceToggle />}
    </>
  );
};

export default AppVersionCard;
