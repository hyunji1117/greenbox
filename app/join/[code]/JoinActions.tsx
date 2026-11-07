'use client';
// app/join/[code]/JoinActions.tsx
// 참여 화면의 버튼. 상태(로그인 전, 동의 전, 이미 구성원, 요청 가능)에 따라 다음 행동 하나만 보여 준다

import React, { useEffect, useTransition } from 'react';
import Link from 'next/link';
import { continueJoinToConsent, startJoinLogin } from '@/app/auth/actions';
import { track, type JoinPageState } from '@/app/lib/analytics/gtag';
import { ApiError } from '@/app/lib/api/apiFetch';
import {
  useMyJoinStatus,
  useRequestJoin,
  useSwitchFridge,
} from '@/app/lib/fridges/useFridgeSharing';

const PRIMARY =
  'flex h-12 w-full items-center justify-center rounded-full bg-[#553C9A] text-base font-semibold text-white shadow-md transition-colors hover:bg-[#4a3388] disabled:cursor-not-allowed disabled:opacity-50';
const SECONDARY =
  'flex h-12 w-full items-center justify-center rounded-full border border-gray-300 bg-white text-base font-semibold text-gray-800';

interface JoinActionsProps {
  code: string;
  state: JoinPageState;
  fridgeId?: string;
}

const JoinActions: React.FC<JoinActionsProps> = ({ code, state, fridgeId }) => {
  const [isMoving, startMoving] = useTransition();
  const requestJoin = useRequestJoin(code);
  const switchFridge = useSwitchFridge();
  // 요청할 수 있는 상태에서만 내 요청 상태를 확인한다 (다시 들어와도 기다리는 화면이 보이게)
  const joinStatus = useMyJoinStatus(code, state === 'can_request');

  useEffect(() => {
    track('join_page_viewed', { state });
  }, [state]);

  const goToFridge = () => (window.location.href = '/?tab=fridge');

  // 기다리던 화면에서 승인되면 잠깐 알린 뒤 초대받은 냉장고로 바로 옮긴다
  // (승인될 때 서버가 이 냉장고를 처음 보일 냉장고로 정해 두었다)
  const approvedWhileWaiting = joinStatus.data?.status === 'member';
  useEffect(() => {
    if (!approvedWhileWaiting) return;
    const timer = setTimeout(goToFridge, 1500);
    return () => clearTimeout(timer);
  }, [approvedWhileWaiting]);

  if (state === 'invalid') {
    return (
      <Link href="/" className={SECONDARY}>
        내 냉장고로 가기
      </Link>
    );
  }

  if (state === 'signed_out' || state === 'needs_consent') {
    return (
      <button
        type="button"
        disabled={isMoving}
        className={PRIMARY}
        onClick={() =>
          startMoving(async () => {
            if (state === 'signed_out') {
              track('login_started');
              await startJoinLogin(code);
            } else {
              await continueJoinToConsent(code);
            }
          })
        }
      >
        {isMoving
          ? '이동하는 중...'
          : state === 'signed_out'
            ? 'Google로 로그인하고 참여 요청하기'
            : '이용 동의하고 계속하기'}
      </button>
    );
  }

  if (state === 'member') {
    return (
      <div className="space-y-3">
        <p className="text-center text-sm text-gray-600">
          이미 함께 보고 있는 냉장고예요.
        </p>
        <button
          type="button"
          disabled={switchFridge.isPending}
          className={PRIMARY}
          onClick={() =>
            fridgeId && switchFridge.mutate(fridgeId, { onSettled: goToFridge })
          }
        >
          이 냉장고 보러 가기
        </button>
      </div>
    );
  }

  // 승인되면 기다리는 화면이 바로 바뀐다 (새로고침 없이 5초마다 확인)
  const joinedFridgeId =
    joinStatus.data?.status === 'member' ? joinStatus.data.fridgeId : null;
  if (joinedFridgeId || requestJoin.data?.status === 'member') {
    const target = joinedFridgeId ?? fridgeId;
    return (
      <div className="space-y-3">
        <p className="rounded-2xl bg-white p-4 text-center text-sm leading-relaxed text-gray-700">
          참여가 승인됐어요.
          <br />
          {joinedFridgeId
            ? '초대받은 냉장고로 이동할게요.'
            : '이제 이 냉장고를 함께 볼 수 있어요.'}
        </p>
        <button
          type="button"
          disabled={switchFridge.isPending}
          className={PRIMARY}
          onClick={() =>
            target
              ? switchFridge.mutate(target, { onSettled: goToFridge })
              : goToFridge()
          }
        >
          이 냉장고 보러 가기
        </button>
      </div>
    );
  }

  // 요청을 보낸 뒤에는 승인을 기다린다는 안내만 남긴다
  if (
    requestJoin.data?.status === 'pending' ||
    joinStatus.data?.status === 'pending'
  ) {
    return (
      // 안내 내용과 아래 버튼(과 방침 링크) 묶음 사이를 제목과 내용처럼 띄운다
      <div className="space-y-8">
        <p className="rounded-2xl bg-white p-4 text-center text-sm leading-relaxed text-gray-700">
          승인을 요청 중이에요. 잠시만 기다려 주세요.
          <br />
          <span className="font-semibold text-[#6B46C1]">초대자</span>가
          승인하면 함께 쓸 수 있어요.
        </p>
        <Link href="/" className={SECONDARY}>
          내 냉장고로 가기
        </Link>
      </div>
    );
  }

  const error = requestJoin.error;
  const errorMessage =
    error instanceof ApiError && error.status === 409
      ? '냉장고는 5개까지 함께 쓸 수 있어요. 다른 냉장고에서 나간 뒤 다시 시도해 주세요.'
      : error instanceof ApiError && error.status === 404
        ? '그사이 링크가 만료됐어요. 새 링크를 받아 주세요.'
        : error
          ? '요청을 보내지 못했어요. 다시 시도해 주세요.'
          : null;

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={requestJoin.isPending}
        className={PRIMARY}
        onClick={() => requestJoin.mutate()}
      >
        {requestJoin.isPending ? '요청하는 중...' : '참여 요청하기'}
      </button>
      {errorMessage && (
        <p className="text-center text-sm text-red-500">{errorMessage}</p>
      )}
      <p className="text-center text-xs text-gray-400">
        내 냉장고는 그대로 남고, 냉장고를 바꿔 가며 볼 수 있어요.
      </p>
    </div>
  );
};

export default JoinActions;
