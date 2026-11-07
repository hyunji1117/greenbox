'use client';
// app/components/fridge/sharing/InviteSection.tsx
// 함께 쓸 사람 초대 링크 만들기, 공유, 복사, 끄기 (가족뿐 아니라 함께 사는 친구도 초대할 수 있다)
// 링크는 24시간만 쓸 수 있고, 새로 만들면 이전 링크는 바로 쓸 수 없다. 링크로 들어와도 승인해야 들어온다
// 참여를 승인하면 링크는 서버가 자동으로 끈다 (app/lib/fridges/sharing.ts decideRequest)

import React, { useState } from 'react';
import { track } from '@/app/lib/analytics/gtag';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import {
  inviteUrl,
  useCreateInvite,
  useInvite,
  useRevokeInvite,
} from '@/app/lib/fridges/useFridgeSharing';

const BUTTON = 'h-10 flex-1 rounded-xl text-sm font-medium disabled:opacity-50';

// "오늘 오후 3:20까지" 처럼 만료 시각을 짧게 쓴다
function formatExpiry(expiresAt: string): string {
  const date = new Date(expiresAt);
  const isToday = date.toDateString() === new Date().toDateString();
  const time = date.toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${isToday ? '오늘' : '내일'} ${time}까지`;
}

const InviteSection: React.FC<{ fridgeId: string; isOpen: boolean }> = ({
  fridgeId,
  isOpen,
}) => {
  const invite = useInvite(fridgeId, isOpen);
  const create = useCreateInvite(fridgeId);
  const revoke = useRevokeInvite(fridgeId);
  const [copied, setCopied] = useState(false);

  const link = invite.data ? inviteUrl(invite.data.code) : null;
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  const share = async () => {
    if (!link) return;
    try {
      await navigator.share({
        title: '우리집 냉장고 함께 보기',
        text: '냉장고를 같이 보려면 이 링크로 참여를 요청해 주세요.',
        url: link,
      });
      track('invite_link_shared', { method: 'share' });
    } catch {
      // 공유 창을 닫은 경우
    }
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      track('invite_link_shared', { method: 'copy' });
    } catch {
      setCopied(false);
    }
  };

  return (
    <section>
      <h3 className="mb-2 px-1 text-sm font-semibold text-gray-700">
        함께 쓸 사람 초대
      </h3>
      <div className={`space-y-3 p-4 ${SURFACE}`}>
        {invite.isPending ? (
          <p className="text-sm text-gray-500">불러오는 중...</p>
        ) : link && invite.data ? (
          <>
            <p className="truncate rounded-xl bg-[#F4F4F8] px-3 py-2.5 text-sm text-gray-700">
              {link}
            </p>
            <p className="text-xs text-gray-500">
              {formatExpiry(invite.data.expiresAt)} 쓸 수 있어요. 링크로 들어온
              사람은 승인해야 들어오고, 승인하면 링크는 자동으로 꺼져요.
            </p>
            <div className="flex gap-2">
              {canShare && (
                <button
                  type="button"
                  onClick={share}
                  className={`${BUTTON} bg-[#6B46C1] text-white`}
                >
                  공유하기
                </button>
              )}
              <button
                type="button"
                onClick={copy}
                className={`${BUTTON} ${canShare ? 'bg-[#F1EDFA] text-[#553C9A]' : 'bg-[#6B46C1] text-white'}`}
              >
                {copied ? '복사했어요' : '링크 복사'}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={create.isPending}
                onClick={() => create.mutate()}
                className={`${BUTTON} bg-white text-gray-700 ring-1 ring-gray-200`}
              >
                새 링크 만들기
              </button>
              <button
                type="button"
                disabled={revoke.isPending}
                onClick={() => revoke.mutate()}
                className={`${BUTTON} bg-white text-red-600 ring-1 ring-gray-200`}
              >
                링크 끄기
              </button>
            </div>
            <p className="text-xs text-gray-400">
              새 링크를 만들거나 끄면 이전 링크는 바로 쓸 수 없어요.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-gray-600">
              냉장고에 함께 쓸 사람을 초대해 공유해 보세요. 링크를 받은 사람이
              참여를 요청하면 여기서 승인한 뒤 함께 볼 수 있어요. 링크는 24시간
              동안 쓸 수 있고, 승인하면 자동으로 꺼져요.
            </p>
            <button
              type="button"
              disabled={create.isPending}
              onClick={() => create.mutate()}
              className="h-11 w-full rounded-xl bg-[#6B46C1] text-sm font-medium text-white disabled:opacity-50"
            >
              {create.isPending ? '만드는 중...' : '초대 링크 만들기'}
            </button>
          </>
        )}
        {(create.isError || revoke.isError || invite.isError) && (
          <p className="text-sm text-red-500">
            처리하지 못했어요. 다시 시도해 주세요.
          </p>
        )}
      </div>
    </section>
  );
};

export default InviteSection;
