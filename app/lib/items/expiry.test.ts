// app/lib/items/expiry.test.ts

import { describe, expect, it } from 'vitest';
import { daysUntilExpiry, expiryLabel, isSavableExpiryDate } from './expiry';

describe('daysUntilExpiry', () => {
  it('시각과 상관없이 날짜 차이만 센다', () => {
    const lateNight = new Date(2026, 10, 1, 23, 59);
    expect(daysUntilExpiry('2026-11-01', lateNight)).toBe(0);
    expect(daysUntilExpiry('2026-11-02', lateNight)).toBe(1);
    expect(daysUntilExpiry('2026-10-30', lateNight)).toBe(-2);
  });
});

describe('expiryLabel', () => {
  it.each([
    [0, '오늘까지'],
    [3, '3일 남음'],
    [-2, '2일 지남'],
  ])('%i일이면 %s로 표시한다', (days, label) => {
    expect(expiryLabel(days)).toBe(label);
  });
});

describe('isSavableExpiryDate', () => {
  it('연도 입력 중인 값은 저장하지 않는다', () => {
    expect(isSavableExpiryDate('0202-11-01')).toBe(false);
    expect(isSavableExpiryDate('2026-11-01')).toBe(true);
  });
});
