'use client';
// app/components/fridge/sharing/FridgeHeader.tsx
// 냉장고 화면 상단: 지금 보는 냉장고 이름(누르면 바꾸기)과 "함께 보는 사람 N명"(누르면 구성원 관리)
// 누가 보고 있는지 항상 보이게 하고, 승인을 기다리는 요청이 있으면 점으로 알린다

import React, { useState } from 'react';
import { ChevronDownIcon, UsersIcon } from 'lucide-react';
import FridgeSwitcherSheet from '@/app/components/fridge/sharing/FridgeSwitcherSheet';
import MembersSheet from '@/app/components/fridge/sharing/MembersSheet';
import { useCurrentFridge } from '@/app/lib/fridges/useCurrentFridge';

const FridgeHeader: React.FC = () => {
  const { data: fridge } = useCurrentFridge();
  const [openSheet, setOpenSheet] = useState<'switch' | 'members' | null>(null);
  const close = () => setOpenSheet(null);

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
        type="button"
        onClick={() => setOpenSheet('switch')}
        className="flex min-h-10 min-w-0 items-center gap-1 rounded-xl text-left"
        aria-label={`${fridge.name}, 냉장고 바꾸기`}
      >
        <h1 className="truncate text-xl font-semibold">{fridge.name}</h1>
        <ChevronDownIcon size={20} className="shrink-0 text-gray-500" />
      </button>
      <button
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
        함께 보는 사람 {fridge.members.length}명
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
    </div>
  );
};

export default FridgeHeader;
