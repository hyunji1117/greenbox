'use client';
// app/components/fridge/NotifyFirstSheet.tsx
// 냉장고를 처음 열 때 한 번 묻는다: 이 냉장고 알림을 어떻게 받을지, 하루 요약은 언제 받을지
// 만든 사람이라고 "전체"를 자동으로 주지 않는다 (가족이 대신 만들어 준 냉장고일 수 있음)
// 건너뛰거나 닫으면 "관심 품목만"으로 정하고 다시 묻지 않는다

import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import BottomSheet from '@/app/components/common/BottomSheet';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import { track } from '@/app/lib/analytics/gtag';
import { useCurrentFridge } from '@/app/lib/fridges/useCurrentFridge';
import {
  useNotificationSettings,
  useSetNotifyLevel,
  useUpdateNotificationSettings,
} from '@/app/lib/notifications/useNotifications';
import { enablePush, getPushStatus } from '@/app/lib/push/subscribe';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  hourLabel,
  type NotifyLevel,
} from '@/app/lib/schemas/notifications';

const LEVEL_CHOICES: { level: NotifyLevel; label: string; hint: string }[] = [
  {
    level: 'all',
    label: '주로 관리해요',
    hint: '이 냉장고의 모든 품목을 알려 드려요',
  },
  {
    level: 'watched',
    label: '가끔 볼게요',
    hint: '내가 넣은 품목과 종을 누른 품목만 알려 드려요',
  },
];

// 가족 응답에서 나온 때: 아침, 점심(장 보러 나가기 전), 저녁 준비 전
const HOUR_CHOICES = [
  { hour: 8, label: '아침' },
  { hour: 12, label: '점심' },
  { hour: 17, label: '저녁 준비 전' },
];

const NotifyFirstSheet: React.FC = () => {
  const fridge = useCurrentFridge().data;
  const settings = useNotificationSettings();
  const setLevel = useSetNotifyLevel();
  const updateSettings = useUpdateNotificationSettings('first');
  const [level, setLevelChoice] = useState<NotifyLevel>('watched');
  const [hour, setHour] = useState(DEFAULT_NOTIFICATION_SETTINGS.dailyHour);
  // 서버 렌더링에는 브라우저 값이 없어 화면이 열린 뒤에 읽는다
  const [canAskPush, setCanAskPush] = useState(false);
  useEffect(() => setCanAskPush(getPushStatus() === 'default'), []);

  // 고르기 전이고, 설정을 불러온 뒤에만 연다 (시각을 물을지 정해야 해서)
  const isOpen =
    fridge !== undefined &&
    fridge.myNotifyLevel === null &&
    settings.data !== undefined &&
    !setLevel.isPending &&
    !setLevel.isSuccess;
  const asksTime = settings.data?.saved === false;

  const skip = () => setLevel.mutate({ level: 'watched', source: 'skip' });

  const submit = async () => {
    // iOS는 누른 동작 안에서만 알림 권한을 물을 수 있어 저장보다 먼저 묻는다
    if (canAskPush) {
      const result = await enablePush().catch(() => 'error' as const);
      track('push_permission_result', { result });
    }
    if (asksTime) updateSettings.mutate({ dailyHour: hour });
    setLevel.mutate({ level, source: 'first' });
  };

  return (
    <BottomSheet isOpen={isOpen} title="알림을 어떻게 받을까요?" onClose={skip}>
      <p className="mb-2 px-1 text-sm font-medium text-gray-700">
        {/* 이름에 따라 조사가 달라져 이름은 따로 보여 준다 */}이 냉장고를 주로
        관리하시나요?
        <span className="block text-xs font-normal text-gray-500">
          {fridge?.name}
        </span>
      </p>
      <div role="radiogroup" className="space-y-2">
        {LEVEL_CHOICES.map(choice => (
          <button
            key={choice.level}
            type="button"
            role="radio"
            aria-checked={level === choice.level}
            onClick={() => setLevelChoice(choice.level)}
            className={`flex w-full items-center gap-3 p-3 text-left ${SURFACE} ${
              level === choice.level ? 'ring-2 ring-[#6B46C1]' : ''
            }`}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                level === choice.level
                  ? 'bg-[#6B46C1] text-white'
                  : 'bg-white ring-1 ring-gray-300'
              }`}
            >
              {level === choice.level && <Check size={14} />}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-gray-800">
                {choice.label}
              </span>
              <span className="block text-xs text-gray-500">{choice.hint}</span>
            </span>
          </button>
        ))}
      </div>

      {asksTime && (
        <>
          <p className="mt-4 mb-2 px-1 text-sm font-medium text-gray-700">
            곧 먹어야 할 식재료는 언제 알려 드릴까요?
          </p>
          <div role="radiogroup" className="grid grid-cols-3 gap-2">
            {HOUR_CHOICES.map(choice => (
              <button
                key={choice.hour}
                type="button"
                role="radio"
                aria-checked={hour === choice.hour}
                onClick={() => setHour(choice.hour)}
                className={`flex h-14 flex-col items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                  hour === choice.hour
                    ? 'bg-[#6B46C1] text-white'
                    : 'bg-white text-gray-700 ring-1 ring-black/10'
                }`}
              >
                {choice.label}
                <span
                  className={`text-xs font-normal ${hour === choice.hour ? 'text-white/80' : 'text-gray-500'}`}
                >
                  {hourLabel(choice.hour)}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-2 px-1 text-xs text-gray-500">
            마이 탭에서 언제든 바꿀 수 있어요
          </p>
        </>
      )}

      <button
        type="button"
        onClick={submit}
        className="mt-5 h-12 w-full rounded-2xl bg-[#6B46C1] text-sm font-semibold text-white transition-colors hover:bg-[#603fad]"
      >
        {canAskPush ? '알림 켜고 시작하기' : '이대로 할게요'}
      </button>
      <button
        type="button"
        onClick={skip}
        className="mx-auto mt-2 flex h-11 items-center px-4 text-sm font-medium text-gray-500"
      >
        나중에 정할게요
      </button>
    </BottomSheet>
  );
};

export default NotifyFirstSheet;
