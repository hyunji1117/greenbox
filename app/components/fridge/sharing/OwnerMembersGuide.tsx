'use client';
// app/components/fridge/sharing/OwnerMembersGuide.tsx
// 냉장고를 만든 사람에게 "누가 함께 보고 있는지"와 내보내는 방법을 알린다
// 배경을 살짝 어둡게 하고 위쪽 "N명" 버튼만 비춘다 (냉장고 바꾸기 안내와 같은 모양)
// 가족이 대신 초대하고 승인해 줬어도 만든 사람이 직접 알 수 있게 한다 (가족 응답 26.11.06)
// 확인하면 사라지고, 새로운 사람이 들어오면 다시 보인다 (기기별로 기억)

import React, { useEffect, useState } from 'react';
import SpotlightGuide from '@/app/components/fridge/sharing/SpotlightGuide';
import type { CurrentFridge } from '@/app/lib/schemas/fridge';

const seenKey = (fridgeId: string) => `greenbox_owner_guide_seen_${fridgeId}`;

function readSeen(fridgeId: string): string[] | null {
  try {
    const raw = localStorage.getItem(seenKey(fridgeId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    // 저장소를 막은 브라우저에서는 매번 뜨지 않도록 보여 주지 않는다
    return null;
  }
}

function writeSeen(fridgeId: string, ids: string[]): void {
  try {
    localStorage.setItem(seenKey(fridgeId), JSON.stringify(ids));
  } catch {
    // 저장하지 못해도 이번 화면에서는 닫힌 상태로 둔다
  }
}

// 아직 확인하지 않은 구성원. 나간 사람은 다시 띄울 이유가 없어 새로 들어온 사람만 센다
export function unseenMembers<T extends { userId: string }>(
  others: T[],
  seenIds: string[],
): T[] {
  return others.filter(member => !seenIds.includes(member.userId));
}

// "엄마님이" / "엄마님 외 2명이"
export function watchersLabel(names: (string | null)[]): string {
  const [first, ...rest] = names.map(name => name ?? '가족');
  return rest.length > 0 ? `${first}님 외 ${rest.length}명이` : `${first}님이`;
}

interface OwnerMembersGuideProps {
  fridge: CurrentFridge;
  // 비출 "N명" 버튼
  target: React.RefObject<HTMLElement | null>;
  // 다른 안내나 시트가 떠 있으면 겹치지 않게 기다린다
  isBlocked: boolean;
  onOpenMembers: () => void;
}

const OwnerMembersGuide: React.FC<OwnerMembersGuideProps> = ({
  fridge,
  target,
  isBlocked,
  onOpenMembers,
}) => {
  const others = fridge.members.filter(m => m.userId !== fridge.myUserId);
  // 서버가 그린 첫 화면과 맞추기 위해 기억한 값은 화면이 붙은 뒤에 읽는다
  const [seenIds, setSeenIds] = useState<string[] | null>(null);
  useEffect(() => setSeenIds(readSeen(fridge.id)), [fridge.id]);

  if (
    isBlocked ||
    fridge.role !== 'owner' ||
    others.length === 0 ||
    seenIds === null ||
    unseenMembers(others, seenIds).length === 0
  ) {
    return null;
  }

  const acknowledge = () => {
    const ids = Array.from(new Set([...seenIds, ...others.map(m => m.userId)]));
    writeSeen(fridge.id, ids);
    setSeenIds(ids);
  };

  return (
    <SpotlightGuide
      target={target}
      title={`${watchersLabel(others.map(m => m.name))} 이 냉장고를 함께 보고 있어요`}
      body="품목, 유통기한, 댓글이 함께 보여요. 위의 사람 수를 누르면 누가 보는지 확인하고, 원하지 않으면 언제든 내보낼 수 있어요."
      primaryLabel="함께 보는 사람 보기"
      spotLabel="함께 보는 사람 열기"
      spotShape="rounded-full"
      onPrimary={() => {
        acknowledge();
        onOpenMembers();
      }}
      onClose={acknowledge}
    />
  );
};

export default OwnerMembersGuide;
