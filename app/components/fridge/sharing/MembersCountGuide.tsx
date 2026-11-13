'use client';
// app/components/fridge/sharing/MembersCountGuide.tsx
// 처음 들어온 사람에게 위쪽 "N명" 칸이 무엇인지 알린다 (사람마다 한 번, 기기별로 기억)
// "N명" 칸은 이 냉장고를 몇 명이 보는지만 보여 주는 칸이라, 초대와 구성원 관리는 마이로 안내한다
// 친구 가족 테스트(2026-11-11)에서 초대를 마이에서 먼저 찾았다

import React from 'react';
import { UserRound } from 'lucide-react';
import SpotlightGuide from '@/app/components/fridge/sharing/SpotlightGuide';

const seenKey = (userId: string) =>
  `greenbox_guide_members_count_seen_${userId}`;

export function hasSeenMembersCountGuide(userId: string): boolean {
  try {
    return localStorage.getItem(seenKey(userId)) === '1';
  } catch {
    // 저장소를 막은 브라우저에서는 매번 뜨지 않도록 보여 주지 않는다
    return true;
  }
}

export function markMembersCountGuideSeen(userId: string): void {
  try {
    localStorage.setItem(seenKey(userId), '1');
  } catch {
    // 저장하지 못해도 이번 화면에서는 닫힌 상태로 둔다
  }
}

interface MembersCountGuideProps {
  target: React.RefObject<HTMLElement | null>;
  onGoToMy: () => void;
  onClose: () => void;
}

const MembersCountGuide: React.FC<MembersCountGuideProps> = ({
  target,
  onGoToMy,
  onClose,
}) => (
  <SpotlightGuide
    guide="members_count"
    target={target}
    title="몇 명이서 이 냉장고를 보는지 여기서 알 수 있어요"
    body={
      <>
        함께 볼 가족 초대는 하단{' '}
        {/* 하단 메뉴의 마이와 같은 아이콘과 색으로 보여 주고, 하단 메뉴의 마이도 함께 비춘다 */}
        <span className="inline-flex items-center gap-0.5 rounded-md bg-[#F1EDFA] px-1.5 py-0.5 align-middle font-semibold text-[#7b6d99]">
          <UserRound size={14} aria-hidden />
          마이
        </span>
        에서 할 수 있어요.
      </>
    }
    alsoHighlight='[data-nav-tab="settings"]'
    primaryLabel="마이로 가기"
    spotLabel="마이에서 함께 볼 사람 초대하기"
    spotShape="rounded-full"
    onPrimary={onGoToMy}
    onClose={onClose}
  />
);

export default MembersCountGuide;
