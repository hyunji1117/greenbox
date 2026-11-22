'use client';
// app/components/fridge/shelves/AutoPlacedGuide.tsx
// 선반 목록에 앱이 추천 자리에 놓은 식재료(점선 카드)가 처음 보일 때 한 번 띄우는 안내 (2026-11-22)
// - 카드 안의 확정 줄 대신 점선과 작은 표식만 두므로, 그 뜻과 누르면 자리를 정한다는 것을 한 번 알려 준다
// - 비춘 카드를 직접 누르면 상세가 열리고 "○○! 여기 둘까요?"로 자리 확정부터 묻는다 (ItemDetailSheet)
// - 선반 둘러보기가 남아 있거나 진행 중이면 기다린다 (둘러보기가 먼저)

import React, { useEffect, useMemo, useState } from 'react';
import SpotlightGuide from '@/app/components/fridge/sharing/SpotlightGuide';
import { useShelfTourStep, wantsShelfTour } from '@/app/lib/shelves/shelfTour';

const seenKey = (userId: string) =>
  `greenbox_guide_shelf_auto_confirm_seen_${userId}`;

function hasSeen(userId: string): boolean {
  try {
    return localStorage.getItem(seenKey(userId)) === '1';
  } catch {
    // 저장소를 막은 브라우저에서는 매번 뜨지 않도록 보여 주지 않는다
    return true;
  }
}

function markSeen(userId: string): void {
  try {
    localStorage.setItem(seenKey(userId), '1');
  } catch {
    // 저장하지 못해도 이번 화면에서는 닫힌 상태로 둔다
  }
}

const AutoPlacedGuide: React.FC<{
  userId: string | undefined;
  // 지금 보이는 목록에 앱이 놓은 식재료가 있는지
  hasAutoPlaced: boolean;
}> = ({ userId, hasAutoPlaced }) => {
  const tourStep = useShelfTourStep();
  // 서버가 그린 첫 화면과 맞추려고 화면이 붙은 뒤에 읽는다
  const [seen, setSeen] = useState(true);
  useEffect(() => {
    if (userId) setSeen(hasSeen(userId));
  }, [userId]);
  const target = useMemo(
    () => ({
      get current() {
        return document.querySelector<HTMLElement>(
          '[data-auto-placed="true"] [data-tour="item-name"]',
        );
      },
    }),
    [],
  );

  if (!userId || seen || !hasAutoPlaced) return null;
  if (tourStep !== null || wantsShelfTour(userId)) return null;
  return (
    <SpotlightGuide
      guide="shelf_auto_confirm"
      target={target}
      title={'점선은 앱이 놓은 자리예요\n눌러서 자리를 정해요'}
      spotLabel="앱이 놓은 식재료 열기"
      tapSpotOnly
      badge="가이드"
      onClose={() => {
        markSeen(userId);
        setSeen(true);
        target.current?.click();
      }}
    />
  );
};

export default AutoPlacedGuide;
