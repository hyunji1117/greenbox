'use client';
// app/components/settings/OperatorTestPush.tsx
// 운영자만 보이는 테스트 알림 버튼. 지금 받을 매일 알림을 문구 A와 B로 한 번씩 보낸다

import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import { apiFetch } from '@/app/lib/api/apiFetch';

const ResultSchema = z.object({
  sent: z.number(),
  failed: z.number(),
  source: z.enum(['due', 'upcoming', 'sample']),
  itemCount: z.number(),
});

const SOURCE_LABEL = {
  due: '오늘 알릴 품목',
  upcoming: '오늘 알릴 품목이 없어 일주일 안 품목',
  sample: '품목이 없어 예시 품목',
} as const;

const OperatorTestPush: React.FC = () => {
  const send = useMutation({
    mutationFn: () =>
      apiFetch('/api/notifications/test', ResultSchema, { method: 'POST' }),
  });

  const message = send.isSuccess
    ? send.data.sent > 0
      ? `${SOURCE_LABEL[send.data.source]} ${send.data.itemCount}개로 A, B 두 알림을 보냈어요`
      : '알림을 받을 기기가 없어요. 알림 켜기를 먼저 해 주세요'
    : send.isError
      ? '보내지 못했어요. 잠시 뒤 다시 시도해 주세요'
      : '아침을 기다리지 않고 지금 받을 매일 알림을 두 문구로 받아 봐요';

  return (
    <div className={`flex items-center justify-between gap-3 p-4 ${SURFACE}`}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800">테스트 알림 보내기</p>
        <p role="status" className="mt-0.5 text-xs text-gray-500">
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => send.mutate()}
        disabled={send.isPending}
        className="h-10 shrink-0 rounded-xl bg-[#F1EDFA] px-4 text-sm font-semibold text-[#553C9A] disabled:opacity-50"
      >
        {send.isPending ? '보내는 중' : '보내기'}
      </button>
    </div>
  );
};

export default OperatorTestPush;
