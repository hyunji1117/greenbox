'use client';
// app/components/fridge/sharing/FridgeHeader.tsx
// 냉장고 화면 상단: 지금 보는 냉장고 이름(누르면 바꾸기)과 이 냉장고를 보는 사람 수, 오른쪽 끝 버튼 자리(선반 보기의 문 닫기)
// 사람 수는 보기 전용이다. 초대와 구성원 관리, 참여 요청은 마이에서 한다 (누를 수 없는 칸에 점을 두면 누르고 싶어져 빼었다)
// 처음 들어온 사람에게는 사람 수 칸이 무엇인지, 만든 사람에게는 함께 보는 사람이 새로 생겼다고 칸을 비추는 안내를 띄운다
// 휴대폰 폭에서 한 줄로 들어가도록 사람 수는 아이콘과 숫자로 짧게 쓴다 (호칭과 냉장고 이름 글자 수 제한과 맞춤)

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, UsersIcon } from 'lucide-react';
import FridgeSwitcherSheet from '@/app/components/fridge/sharing/FridgeSwitcherSheet';
import MembersCountGuide, {
  hasSeenMembersCountGuide,
  markMembersCountGuideSeen,
} from '@/app/components/fridge/sharing/MembersCountGuide';
import SwitchGuide from '@/app/components/fridge/sharing/SwitchGuide';
import OwnerMembersGuide from '@/app/components/fridge/sharing/OwnerMembersGuide';
import { useCurrentFridge } from '@/app/lib/fridges/useCurrentFridge';
import { goToTab } from '@/app/lib/navigation/tabs';

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

interface FridgeHeaderProps {
  // 오른쪽 끝에 둘 버튼 (선반 보기에서 문이 열렸을 때 문 닫기)
  trailing?: React.ReactNode;
}

const FridgeHeader: React.FC<FridgeHeaderProps> = ({ trailing }) => {
  const { data: fridge } = useCurrentFridge();
  const [openSheet, setOpenSheet] = useState<'switch' | null>(null);
  // 서버가 그린 첫 화면과 맞추기 위해, 안내를 볼지는 화면이 붙은 뒤에 저장소를 읽어 정한다
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const titleRef = useRef<HTMLButtonElement>(null);
  const membersRef = useRef<HTMLDivElement>(null);
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
  // 사람 수 칸 안내: 처음 들어온 사람마다 한 번
  const [isCountGuideOpen, setIsCountGuideOpen] = useState(false);
  useEffect(() => {
    if (myUserId && !hasSeenMembersCountGuide(myUserId)) {
      setIsCountGuideOpen(true);
    }
  }, [myUserId]);
  const closeCountGuide = useCallback(() => {
    if (myUserId) markMembersCountGuideSeen(myUserId);
    setIsCountGuideOpen(false);
  }, [myUserId]);

  if (!fridge) {
    return (
      <div className="mb-4 flex h-10 items-center">
        <h1 className="text-xl font-semibold">우리집 냉장고</h1>
      </div>
    );
  }

  // 알림 첫 질문, 냉장고 바꾸기 안내, 시트가 끝난 뒤에 하나씩 보여 겹치지 않게 한다
  const isBusy =
    isGuideOpen || openSheet !== null || fridge.myNotifyLevel === null;

  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      {/* 사람 수는 이 냉장고에 속한 정보라 이름 바로 옆에 둔다. 이름(냉장고 바꾸기 버튼) 밖에 두어 눌러도 바꾸기가 열리지 않게 하고,
          이름이 길면 이름이 먼저 줄어든다. 오른쪽 끝은 문 닫기 같은 버튼 자리 */}
      <div className="flex min-w-0 items-center gap-2">
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
        <div
          ref={membersRef}
          role="status"
          aria-label={`이 냉장고를 보는 사람 ${fridge.members.length}명`}
          className="flex h-7 shrink-0 items-center gap-1 rounded-full px-1 text-sm font-medium whitespace-nowrap text-[#7b6d99]"
        >
          <UsersIcon size={15} aria-hidden />
          <span aria-hidden>{fridge.members.length}명</span>
        </div>
      </div>
      {trailing}
      <FridgeSwitcherSheet
        isOpen={openSheet === 'switch'}
        onClose={close}
        current={fridge}
      />
      {isCountGuideOpen && !isBusy && (
        <MembersCountGuide
          target={membersRef}
          onGoToMy={() => {
            closeCountGuide();
            goToTab('settings');
          }}
          onClose={closeCountGuide}
        />
      )}
      <OwnerMembersGuide
        fridge={fridge}
        target={membersRef}
        isBlocked={isBusy || isCountGuideOpen}
        onOpenMembers={() => goToTab('settings')}
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
