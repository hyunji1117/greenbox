// app/lib/schemas/notifications.test.ts

import { describe, expect, it } from 'vitest';
import { hourLabel, UpdateNotificationSettingsSchema } from './notifications';

describe('hourLabel', () => {
  it('자정과 정오를 헷갈리지 않게 표시한다', () => {
    expect(hourLabel(0)).toBe('밤 12시');
    expect(hourLabel(8)).toBe('오전 8시');
    expect(hourLabel(12)).toBe('낮 12시');
    expect(hourLabel(17)).toBe('오후 5시');
    expect(hourLabel(23)).toBe('오후 11시');
  });
});

describe('UpdateNotificationSettingsSchema', () => {
  it('한 항목만 보내도 되고, 범위를 벗어나면 거절한다', () => {
    expect(
      UpdateNotificationSettingsSchema.safeParse({ dailyHour: 0 }).success,
    ).toBe(true);
    expect(
      UpdateNotificationSettingsSchema.safeParse({ dailyHour: -1 }).success,
    ).toBe(false);
    expect(
      UpdateNotificationSettingsSchema.safeParse({ weeklyDay: 6 }).success,
    ).toBe(true);
  });
});
