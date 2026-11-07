'use client';
// app/components/fridge/sharing/FridgeHeader.tsx
// 냉장고 화면 상단: 지금 보는 냉장고 이름(누르면 바꾸기)과 함께 보는 사람 수(누르면 구성원 관리)
// 누가 보고 있는지 항상 보이게 하고, 승인을 기다리는 요청이 있으면 점으로 알린다
// 만든 사람에게는 함께 보는 사람이 새로 생기면 사람 수 버튼을 비추는 안내를 띄운다
// 휴대폰 폭에서 한 줄로 들어가도록 사람 수는 아이콘과 숫자로 짧게 쓴다 (호칭과 냉장고 이름 글자 수 제한과 맞춤)

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, UsersIcon } from 'lucide-react';
import FridgeSwitcherSheet from '@/app/components/fridge/sharing/FridgeSwitcherSheet';
import MembersSheet from '@/app/components/fridge/sharing/MembersSheet';
import SwitchGuide from '@/app/components/fridge/sharing/SwitchGuide';
import OwnerMembersGuide from '@/app/components/fridge/sharing/OwnerMembersGuide';
import { useCurrentFridge } from '@/app/lib/fridges/useCurrentFridge';

// 안내는 사람마다 한 번만 보여 준다 (기기별로 기억)
const guideSeenKey = (userId: string) =>
  `greenbox_guide_fridge_switch_seen_${userId}`;

function hasSeenGuide(userId: string): boolean {
  try {
    return localStorage.getItem(guideSeenKey(userId)) === '1';
  } catch {
    // 저장소를 막은 브라우저에서는 안내를 띄우지 않는다 (매번 뜨지 않게)
    return true;
  }
}

function markGuideSeen(userId: string): void {
  try {
    localStorage.setItem(guideSeenKey(userId), '1');
  } catch {
    // 저장하지 못해도 이번 화면에서는 닫힌 상태로 둔다
  }
}

const FridgeHeader: React.FC = () => {
  const { data: fridge } = useCurrentFridge();
  const [openSheet, setOpenSheet] = useState<'switch' | 'members' | null>(null);
  // 서버가 그린 첫 화면과 맞추기 위해, 안내를 볼지는 화면이 붙은 뒤에 저장소를 읽어 정한다
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const titleRef = useRef<HTMLButtonElement>(null);
  const membersRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpenSheet(null), []);

  const myUserId = fridge?.myUserId;
  // 초대받아 냉장고가 2개 이상이 된 뒤 처음 한 번
  const hasJoinedFridge = (fridge?.fridgeCount ?? 1) > 1;
  useEffect(() => {
    if (myUserId && hasJoinedFridge && !hasSeenGuide(myUserId)) {
      setIsGuideOpen(true);
    }
  }, [myUserId, hasJoinedFridge]);
  const closeGuide = useCallback(() => {
    if (myUserId) markGuideSeen(myUserId);
    setIsGuideOpen(false);
  }, [myUserId]);

  if (!fridge) {
    return (
      <div className="mb-4 flex h-10 items-center">
        <h1 className="text-xl font-semibold">우리집 냉장고</h1>
      </div>
    );
  }

  const hasRequests = fridge.pendingRequestCount > 0;

  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <button
        ref={titleRef}
        type="button"
        onClick={() => setOpenSheet('switch')}
        className="flex min-h-10 min-w-0 items-center gap-1 rounded-xl text-left"
        aria-label={`${fridge.name}, 냉장고 바꾸기`}
      >
        <h1 className="truncate text-xl font-semibold">{fridge.name}</h1>
        <ChevronDownIcon size={20} className="shrink-0 text-gray-500" />
      </button>
      <button
        ref={membersRef}
        type="button"
        onClick={() => setOpenSheet('members')}
        className="relative flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-3 text-sm font-medium text-[#553C9A] shadow-[0_4px_20px_rgba(75,47,140,0.07)] ring-1 ring-black/5"
        aria-label={
          hasRequests
            ? `함께 보는 사람 ${fridge.members.length}명, 참여 요청 ${fridge.pendingRequestCount}건`
            : `함께 보는 사람 ${fridge.members.length}명`
        }
      >
        <UsersIcon size={16} />
        {fridge.members.length}명
        {hasRequests && (
          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-[#F0F0F4]" />
        )}
      </button>
      <FridgeSwitcherSheet
        isOpen={openSheet === 'switch'}
        onClose={close}
        current={fridge}
      />
      <MembersSheet
        isOpen={openSheet === 'members'}
        onClose={close}
        fridge={fridge}
      />
      {/* 냉장고 바꾸기 안내, 시트, 알림 첫 질문이 끝난 뒤에 보여 겹치지 않게 한다 */}
      <OwnerMembersGuide
        fridge={fridge}
        target={membersRef}
        isBlocked={
          isGuideOpen || openSheet !== null || fridge.myNotifyLevel === null
        }
        onOpenMembers={() => setOpenSheet('members')}
      />
      {isGuideOpen && (
        <SwitchGuide
          target={titleRef}
          onClose={closeGuide}
          onTryIt={() => {
            closeGuide();
            setOpenSheet('switch');
          }}
        />
      )}
    </div>
  );
};

export default FridgeHeader;
