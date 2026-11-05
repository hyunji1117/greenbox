'use client';
// app/components/settings/InternalDeviceToggle.tsx
// 개발자가 자기 기기를 테스트 기기로 표시하는 스위치
// 표시한 기기의 이용 기록은 GA 보고서에서 빠지고 DebugView에서만 보인다 (설치한 앱은 주소에 ?internal=on을 붙이기 어려워 둠)

import React, { useState, useSyncExternalStore } from 'react';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import { isInternalDevice, setInternalDevice } from '@/app/lib/analytics/gtag';

const subscribe = () => () => {};

const InternalDeviceToggle: React.FC = () => {
  const stored = useSyncExternalStore(subscribe, isInternalDevice, () => false);
  const [override, setOverride] = useState<boolean | null>(null);
  const isOn = override ?? stored;

  const toggle = () => {
    setInternalDevice(!isOn);
    setOverride(!isOn);
  };

  return (
    <div className={`flex items-center justify-between gap-3 p-4 ${SURFACE}`}>
      <div className="min-w-0">
        <p
          id="internal-device-label"
          className="text-sm font-medium text-gray-800"
        >
          테스트 기기로 표시
        </p>
        <p className="mt-0.5 text-xs text-gray-500">
          개발자용이에요. 이용 통계에서 이 기기를 빼요. 앱을 다시 열면 적용돼요
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-labelledby="internal-device-label"
        onClick={toggle}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          isOn ? 'bg-[#6B46C1]' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            isOn ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
};

export default InternalDeviceToggle;
