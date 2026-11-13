'use client';
// app/components/settings/MembersEntryCard.tsx
// 마이에서도 "함께 보는 사람"(초대, 참여 요청, 구성원 관리)으로 들어가는 길
// 친구 가족 테스트(2026-11-11): 초대와 구성원 관리를 마이에서 먼저 찾았는데 냉장고 화면 위쪽 버튼에만 있었음
// 냉장고 화면과 같은 시트(MembersSheet)를 열어 두 곳의 동작이 갈라지지 않게 한다

import React, { useState } from 'react';
import { ChevronRightIcon, UsersIcon } from 'lucide-react';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import MembersSheet from '@/app/components/fridge/sharing/MembersSheet';
import { useCurrentFridge } from '@/app/lib/fridges/useCurrentFridge';

const MembersEntryCard: React.FC = () => {
  const { data: fridge } = useCurrentFridge();
  const [isOpen, setIsOpen] = useState(false);
  if (!fridge) return null;

  const hasRequests = fridge.pendingRequestCount > 0;
  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex w-full items-center gap-3 p-4 text-left ${SURFACE}`}
      >
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1EDFA] text-[#6B46C1]">
          <UsersIcon size={20} aria-hidden />
          {hasRequests && (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white"
            />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-gray-800">
            사용자 초대하기
          </span>
          <span className="block truncate text-xs text-gray-500">
            {fridge.name}, {fridge.members.length}명
            {hasRequests ? `, 참여 요청 ${fridge.pendingRequestCount}건` : ''}
          </span>
        </span>
        <ChevronRightIcon size={18} className="shrink-0 text-gray-400" />
      </button>
      <MembersSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        fridge={fridge}
      />
    </>
  );
};

export default MembersEntryCard;
