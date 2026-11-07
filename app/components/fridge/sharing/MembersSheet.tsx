'use client';
// app/components/fridge/sharing/MembersSheet.tsx
// 함께 보는 사람: 참여 요청 승인, 구성원 목록과 내보내기, 초대 링크, 나가기
// 냉장고를 쓰는 사람이 "누가 보는지" 항상 알고 정할 수 있게 한다. 누가 언제 봤는지는 기록하지 않는다

import React, { useState } from 'react';
import BottomSheet from '@/app/components/common/BottomSheet';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import MemberAvatar from '@/app/components/fridge/sharing/MemberAvatar';
import InviteSection from '@/app/components/fridge/sharing/InviteSection';
import { ApiError } from '@/app/lib/api/apiFetch';
import {
  useDecideRequest,
  useLeaveFridge,
  usePendingRequests,
  useRemoveMember,
} from '@/app/lib/fridges/useFridgeSharing';
import type { CurrentFridge } from '@/app/lib/schemas/fridge';

const SECTION_TITLE = 'mb-2 px-1 text-sm font-semibold text-gray-700';
const SMALL_BUTTON =
  'h-9 shrink-0 rounded-xl px-3 text-sm font-medium disabled:opacity-50';

interface MembersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  fridge: CurrentFridge;
}

const MembersSheet: React.FC<MembersSheetProps> = ({
  isOpen,
  onClose,
  fridge,
}) => {
  const requests = usePendingRequests(fridge.id, isOpen);
  const decide = useDecideRequest(fridge.id);
  const removeMember = useRemoveMember(fridge.id);
  const leave = useLeaveFridge(fridge.id);
  // 되돌리기 어려운 동작은 한 번 더 확인한다 (브라우저 확인 창 대신 화면 안에서)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const isOwner = fridge.role === 'owner';
  const isMe = (userId: string) => userId === fridge.myUserId;

  return (
    <BottomSheet isOpen={isOpen} title="함께 보는 사람" onClose={onClose}>
      <div className="space-y-5">
        {(requests.data?.length ?? 0) > 0 && (
          <section>
            <h3 className={SECTION_TITLE}>참여 요청</h3>
            <ul className={`divide-y divide-gray-100 ${SURFACE}`}>
              {requests.data?.map(request => {
                const name = request.name ?? '이름 없는 사용자';
                return (
                  <li key={request.id} className="space-y-3 p-4">
                    <div className="flex items-center gap-3">
                      <MemberAvatar image={request.image} />
                      <span className="min-w-0 truncate font-semibold text-gray-900">
                        {name}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-gray-600">
                      승인하면 {name}님이 이 냉장고의 품목, 유통기한, 댓글을 볼
                      수 있어요.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={decide.isPending}
                        onClick={() =>
                          decide.mutate({
                            requestId: request.id,
                            decision: 'approve',
                          })
                        }
                        className={`${SMALL_BUTTON} flex-1 bg-[#6B46C1] text-white`}
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        disabled={decide.isPending}
                        onClick={() =>
                          decide.mutate({
                            requestId: request.id,
                            decision: 'reject',
                          })
                        }
                        className={`${SMALL_BUTTON} flex-1 bg-white text-gray-700 ring-1 ring-gray-200`}
                      >
                        {/* 내가 보낸 초대에 대한 요청이라 "거절"보다 부드러운 "취소"로 부른다 (하는 일은 거절) */}
                        취소
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            {decide.error instanceof ApiError &&
              decide.error.status === 409 && (
                <p className="mt-2 px-1 text-sm text-red-500">
                  요청한 사람이 이미 냉장고 5개를 쓰고 있어 승인할 수 없어요.
                </p>
              )}
          </section>
        )}

        <section>
          <h3 className={SECTION_TITLE}>
            지금 {fridge.members.length}명이 함께 보고 있어요
          </h3>
          <ul className={`divide-y divide-gray-100 ${SURFACE}`}>
            {fridge.members.map(member => {
              const me = isMe(member.userId);
              const isConfirming = confirmRemoveId === member.userId;
              return (
                <li key={member.userId} className="p-4">
                  <div className="flex items-center gap-3">
                    <MemberAvatar image={member.image} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-gray-900">
                        {member.name ?? '이름 없는 구성원'}
                        {me && (
                          <span className="ml-1 text-sm font-normal text-gray-400">
                            (나)
                          </span>
                        )}
                      </span>
                      {member.role === 'owner' && (
                        <span className="text-xs text-[#553C9A]">
                          만든 사람
                        </span>
                      )}
                    </span>
                    {isOwner && !me && member.role !== 'owner' && (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmRemoveId(
                            isConfirming ? null : member.userId,
                          )
                        }
                        className={`${SMALL_BUTTON} text-red-600 hover:bg-red-50`}
                      >
                        내보내기
                      </button>
                    )}
                  </div>
                  {isConfirming && (
                    <div className="mt-3 rounded-xl bg-red-50 p-3">
                      <p className="text-sm text-red-700">
                        내보내면 바로 이 냉장고를 볼 수 없어요. 그동안 넣은
                        품목과 댓글은 남아요.
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          disabled={removeMember.isPending}
                          onClick={() =>
                            removeMember.mutate(member.userId, {
                              onSuccess: () => setConfirmRemoveId(null),
                            })
                          }
                          className={`${SMALL_BUTTON} bg-red-600 text-white`}
                        >
                          내보내기
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRemoveId(null)}
                          className={`${SMALL_BUTTON} bg-white text-gray-700`}
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {removeMember.isError && (
            <p className="mt-2 px-1 text-sm text-red-500">
              내보내지 못했어요. 다시 시도해 주세요.
            </p>
          )}
        </section>

        <InviteSection fridgeId={fridge.id} isOpen={isOpen} />

        {fridge.members.length > 1 && (
          <section>
            {confirmLeave ? (
              <div className={`p-4 ${SURFACE}`}>
                <p className="text-sm leading-relaxed text-gray-700">
                  나가면 이 냉장고를 더 볼 수 없어요. 내가 넣은 품목과 댓글은
                  냉장고에 남아요.
                  {isOwner &&
                    ' 만든 사람 역할은 가장 먼저 들어온 구성원에게 넘어가요.'}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={leave.isPending}
                    onClick={() =>
                      leave.mutate(undefined, { onSuccess: onClose })
                    }
                    className={`${SMALL_BUTTON} flex-1 bg-red-600 text-white`}
                  >
                    나가기
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmLeave(false)}
                    className={`${SMALL_BUTTON} flex-1 bg-[#F4F4F8] text-gray-700`}
                  >
                    취소
                  </button>
                </div>
                {leave.isError && (
                  <p className="mt-2 text-sm text-red-500">
                    나가지 못했어요. 다시 시도해 주세요.
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmLeave(true)}
                className="h-11 w-full rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
              >
                이 냉장고에서 나가기
              </button>
            )}
          </section>
        )}
      </div>
    </BottomSheet>
  );
};

export default MembersSheet;
