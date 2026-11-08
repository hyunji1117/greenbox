'use client';
// app/components/settings/NotificationSettingsCard.tsx
// 알림을 받을 시각과 이 냉장고의 알림 수준. 가족마다 생활 시간이 달라 사람마다 정한다
// 바꾸면 바로 저장한다 (저장 버튼 없음). 실패하면 원래 값으로 돌아가고 안내한다

import React from 'react';
import { BellIcon, ChevronDownIcon } from 'lucide-react';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import { useCurrentFridge } from '@/app/lib/fridges/useCurrentFridge';
import {
  useNotificationSettings,
  useSetNotifyLevel,
  useUpdateNotificationSettings,
} from '@/app/lib/notifications/useNotifications';
import {
  DEFAULT_NOTIFY_LEVEL,
  hourLabel,
  WEEKDAY_LABELS,
  type NotifyLevel,
} from '@/app/lib/schemas/notifications';

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

const LEVEL_OPTIONS: { level: NotifyLevel; label: string }[] = [
  { level: 'all', label: '전체 품목' },
  { level: 'watched', label: '관심 품목만' },
  { level: 'none', label: '받지 않음' },
];

// 관심 품목 안내의 종은 품목 카드에서 켜진 종과 같은 아이콘과 색으로 보여 준다
const LEVEL_HINT: Record<NotifyLevel, React.ReactNode> = {
  all: '이 냉장고의 모든 품목을 알려 드려요',
  watched: (
    <>
      내가 넣은 품목과 종
      <BellIcon
        size={15}
        aria-hidden
        className="mx-0.5 inline-block align-middle text-[#6B46C1]"
      />
      을 누른 품목만 알려 드려요
    </>
  ),
  none: '이 냉장고 품목은 알려 드리지 않아요',
};

// iOS Safari는 16px 미만 입력을 누르면 화면을 확대하므로 text-base를 쓴다
// 기본 화살표는 칸 오른쪽 끝에 붙어 그려져, 기본 모양을 끄고 안쪽 여백에 맞춘 화살표를 직접 둔다
// 항목 이름(pl-3)은 선택칸 안 글자와 같은 시작점에 둔다
const SELECT =
  'h-11 w-full appearance-none rounded-xl bg-[#F4F4F8] pr-9 pl-3 text-base text-gray-700 focus:ring-1 focus:ring-[#A794D6] focus:outline-none disabled:opacity-50';

const Select: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }
> = ({ children, ...props }) => (
  <div className="relative min-w-0 flex-1">
    <select {...props} className={SELECT}>
      {children}
    </select>
    <ChevronDownIcon
      size={18}
      aria-hidden
      className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500"
    />
  </div>
);

const Switch: React.FC<{
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}> = ({ checked, label, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
      checked ? 'bg-[#6B46C1]' : 'bg-gray-300'
    }`}
  >
    <span
      className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-5' : ''
      }`}
    />
  </button>
);

const NotificationSettingsCard: React.FC = () => {
  const { data } = useNotificationSettings();
  const fridge = useCurrentFridge().data;
  const update = useUpdateNotificationSettings('settings');
  const setLevel = useSetNotifyLevel();
  if (!data) return null;
  const { settings } = data;
  const level = fridge?.myNotifyLevel ?? DEFAULT_NOTIFY_LEVEL;
  const off = !settings.enabled;

  return (
    <div className={`space-y-4 p-4 ${SURFACE}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-gray-800">알림 설정</h2>
        <Switch
          checked={settings.enabled}
          label="알림 받기"
          onChange={enabled => update.mutate({ enabled })}
        />
      </div>

      <div>
        <label
          htmlFor="daily-hour"
          className="mb-1 block pl-3 text-xs font-medium text-gray-500"
        >
          매일 알림
        </label>
        <Select
          id="daily-hour"
          value={settings.dailyHour}
          disabled={off}
          onChange={e => update.mutate({ dailyHour: Number(e.target.value) })}
        >
          {HOURS.map(hour => (
            <option key={hour} value={hour}>
              매일 {hourLabel(hour)}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="pl-3 text-xs font-medium text-gray-500">
            장보기 전 알림
          </span>
          <Switch
            checked={settings.weeklyEnabled}
            label="장보기 전 알림 받기"
            onChange={weeklyEnabled => update.mutate({ weeklyEnabled })}
          />
        </div>
        <div className="flex gap-2">
          <Select
            aria-label="장 보는 요일"
            value={settings.weeklyDay}
            disabled={off || !settings.weeklyEnabled}
            onChange={e => update.mutate({ weeklyDay: Number(e.target.value) })}
          >
            {WEEKDAY_LABELS.map((label, day) => (
              <option key={label} value={day}>
                {label}요일
              </option>
            ))}
          </Select>
          <Select
            aria-label="장보기 전 알림 시각"
            value={settings.weeklyHour}
            disabled={off || !settings.weeklyEnabled}
            onChange={e =>
              update.mutate({ weeklyHour: Number(e.target.value) })
            }
          >
            {HOURS.map(hour => (
              <option key={hour} value={hour}>
                {hourLabel(hour)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {fridge && (
        <div>
          <p className="mb-1 pl-3 text-xs font-medium text-gray-500">
            {fridge.name} 알림
          </p>
          <div
            role="radiogroup"
            aria-label={`${fridge.name} 알림 수준`}
            className="grid grid-cols-3 gap-1 rounded-xl bg-[#F4F4F8] p-1"
          >
            {LEVEL_OPTIONS.map(option => (
              <button
                key={option.level}
                type="button"
                role="radio"
                aria-checked={level === option.level}
                disabled={off}
                onClick={() =>
                  setLevel.mutate({ level: option.level, source: 'settings' })
                }
                className={`h-10 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                  level === option.level
                    ? 'bg-white text-[#553C9A] shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-1 pl-3 text-xs text-gray-500">{LEVEL_HINT[level]}</p>
        </div>
      )}

      {(update.isError || setLevel.isError) && (
        <p role="alert" className="text-xs text-red-500">
          저장하지 못해 원래대로 되돌렸어요. 다시 시도해 주세요.
        </p>
      )}
    </div>
  );
};

export default NotificationSettingsCard;
