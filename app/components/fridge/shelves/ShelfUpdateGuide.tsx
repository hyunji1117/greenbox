'use client';
// app/components/fridge/shelves/ShelfUpdateGuide.tsx
// 선반 보기 업데이트를 모든 사람에게 한 번씩 알리는 안내 (사람마다, 기기별로 기억)
// - 문이 닫혀 있을 때: 냉장실 문의 알림장을 비추고, 눌러서 크게 열고 확인하는 법을 알린다
// - 문을 처음 열었을 때: 냉장고를 비추고, 화면 끝에서 안쪽으로 밀어 닫는 법을 알린다
// 알림 첫 질문이 떠 있으면 끝난 뒤에 띄우고, 다른 안내(함께 보는 사람 등)와의 순서는 SpotlightGuide가 줄을 세운다
// 제목은 5글자 안팎, 설명은 한 줄에 한 문장으로 휴대폰 폭(320px)에서도 줄바꿈 없이 들어가게 쓴다

import React, { useCallback, useEffect, useState } from 'react';
import SpotlightGuide from '@/app/components/fridge/sharing/SpotlightGuide';

export type ShelfGuideStep = 'board' | 'swipe';

const seenKey = (step: ShelfGuideStep, userId: string) =>
  `greenbox_guide_shelf_${step}_seen_${userId}`;

export function hasSeenShelfGuide(
  step: ShelfGuideStep,
  userId: string,
): boolean {
  try {
    return localStorage.getItem(seenKey(step, userId)) === '1';
  } catch {
    // 저장소를 막은 브라우저에서는 매번 뜨지 않도록 보여 주지 않는다
    return true;
  }
}

function markShelfGuideSeen(step: ShelfGuideStep, userId: string): void {
  try {
    localStorage.setItem(seenKey(step, userId), '1');
  } catch {
    // 저장하지 못해도 이번 화면에서는 닫힌 상태로 둔다
  }
}

const Lines: React.FC<{ lines: string[] }> = ({ lines }) => (
  <>
    {lines.map(line => (
      <span key={line} className="block">
        {line}
      </span>
    ))}
  </>
);

export const SHELF_GUIDE_COPY = {
  board: {
    title: '알림장 등장',
    lines: ['누르면 크게 열려서 메모를 써요.', '읽은 메모는 눌러서 확인해요.'],
    primary: '열어 보기',
  },
  swipe: {
    title: '밀어서 닫기',
    lines: [
      '화면 끝에서 안쪽으로 밀어 보세요.',
      '위쪽 문 닫기 버튼도 그대로예요.',
    ],
    primary: '문 닫아 보기',
  },
} as const;

interface ShelfUpdateGuideProps {
  userId: string | undefined;
  isOpen: boolean;
  // 알림 첫 질문처럼 먼저 끝나야 하는 것이 떠 있으면 true
  isBlocked: boolean;
  boardTarget: React.RefObject<HTMLElement | null>;
  doorsTarget: React.RefObject<HTMLElement | null>;
  onOpenBoard: () => void;
  onCloseDoors: () => void;
}

const ShelfUpdateGuide: React.FC<ShelfUpdateGuideProps> = ({
  userId,
  isOpen,
  isBlocked,
  boardTarget,
  doorsTarget,
  onOpenBoard,
  onCloseDoors,
}) => {
  // 지금 띄우려는 안내. 한 번 띄우면 닫을 때까지 그대로 둔다
  const [shown, setShown] = useState<ShelfGuideStep | null>(null);
  const step: ShelfGuideStep = isOpen ? 'swipe' : 'board';

  // 서버가 그린 첫 화면과 맞추기 위해, 볼지는 화면이 붙은 뒤에 저장소를 읽어 정한다
  useEffect(() => {
    if (shown || !userId || isBlocked) return;
    if (!hasSeenShelfGuide(step, userId)) setShown(step);
  }, [shown, userId, isBlocked, step]);

  // 안내가 떠 있는 동안 문이 바뀌면(버튼, 밀기) 그 안내는 본 것으로 두고 닫는다
  useEffect(() => {
    if (shown && shown !== step) {
      if (userId) markShelfGuideSeen(shown, userId);
      setShown(null);
    }
  }, [shown, step, userId]);

  const close = useCallback(() => {
    if (shown && userId) markShelfGuideSeen(shown, userId);
    setShown(null);
  }, [shown, userId]);

  if (!shown || shown !== step) return null;
  const copy = SHELF_GUIDE_COPY[shown];
  return (
    <SpotlightGuide
      guide={shown === 'board' ? 'shelf_board' : 'door_swipe'}
      target={shown === 'board' ? boardTarget : doorsTarget}
      title={copy.title}
      body={<Lines lines={[...copy.lines]} />}
      primaryLabel={copy.primary}
      spotLabel={shown === 'board' ? '알림장 열기' : '냉장고 문 닫기'}
      onPrimary={() => {
        close();
        if (shown === 'board') onOpenBoard();
        else onCloseDoors();
      }}
      onClose={close}
    />
  );
};

export default ShelfUpdateGuide;
