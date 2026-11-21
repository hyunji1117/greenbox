'use client';
// app/components/settings/GuideTestCard.tsx
// 테스트 계정 전용 가이드 테스트. 켜면 아래 메뉴의 탭을 골라 그 탭의 안내를 다시 볼 수 있다
// 켜져 있는 동안 이 기기에서는 GA4로 아무것도 보내지 않아 안내를 여러 번 띄워도 통계에 잡히지 않는다

import React, { useState, useSyncExternalStore } from 'react';
import Switch from '@/app/components/common/Switch';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import { setGuideTestMode } from '@/app/lib/analytics/gtag';
import {
  GUIDE_PAGES,
  isGuideTestOn,
  resetGuides,
  type GuidePage,
} from '@/app/lib/testing/guideTest';

const subscribe = () => () => {};

// 탭이 화면에 이미 붙어 있으면 안내가 다시 뜨지 않으므로, 기록을 지운 뒤 그 탭을 새로 연다
export function replayGuides(
  pages: GuidePage[],
  navigate: (url: string) => void = url => window.location.assign(url),
): void {
  resetGuides(pages);
  navigate(`/?tab=${pages[0].tab}`);
}

const GuideTestCard: React.FC = () => {
  const stored = useSyncExternalStore(subscribe, isGuideTestOn, () => false);
  const [override, setOverride] = useState<boolean | null>(null);
  const isOn = override ?? stored;

  const toggle = () => {
    setGuideTestMode(!isOn);
    setOverride(!isOn);
  };

  return (
    <div className={`p-4 ${SURFACE}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p
            id="guide-test-label"
            className="text-sm font-medium text-gray-800"
          >
            가이드 테스트
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            켜 있는 동안 이 기기의 이용 통계를 보내지 않아요
          </p>
        </div>
        <Switch
          checked={isOn}
          labelledBy="guide-test-label"
          onChange={toggle}
        />
      </div>
      {isOn && (
        // 아래 메뉴와 같은 탭 목록. 누르면 그 탭의 안내 기록을 지우고 그 탭을 새로 열어 안내를 다시 띄운다
        <ul className="mt-3 space-y-2" aria-label="탭별 가이드 보기">
          {GUIDE_PAGES.map(page => {
            const hasGuides = page.guides.length > 0;
            return (
              <li key={page.tab}>
                <button
                  type="button"
                  disabled={!hasGuides}
                  onClick={() => replayGuides([page])}
                  className="flex w-full items-center justify-between gap-3 rounded-xl bg-[#F1EDFA] px-4 py-3 text-left disabled:bg-[#F4F4F8]"
                >
                  <span className="min-w-0">
                    <span
                      className={`block text-sm font-semibold ${
                        hasGuides ? 'text-[#553C9A]' : 'text-gray-400'
                      }`}
                    >
                      {page.label} 탭 가이드 보기
                    </span>
                    <span
                      className={`mt-0.5 block text-xs ${
                        hasGuides ? 'text-[#7b6d99]' : 'text-gray-400'
                      }`}
                    >
                      {hasGuides ? page.guides.join(', ') : '안내 없음'}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default GuideTestCard;
