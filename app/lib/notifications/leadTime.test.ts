// app/lib/notifications/leadTime.test.ts

import { describe, expect, it } from 'vitest';
import { isDueForDaily, leadDays } from './leadTime';

describe('leadDays', () => {
  it('보관 기간이 길수록 미리 알린다', () => {
    expect(leadDays(1)).toBe(0);
    expect(leadDays(3)).toBe(0);
    expect(leadDays(4)).toBe(1);
    expect(leadDays(14)).toBe(1);
    expect(leadDays(15)).toBe(3);
    expect(leadDays(60)).toBe(3);
    expect(leadDays(61)).toBe(7);
    expect(leadDays(365)).toBe(7);
  });
});

describe('isDueForDaily', () => {
  it('짧게 보관하는 품목은 당일에만 넣는다', () => {
    expect(isDueForDaily({ periodDays: 2, daysLeft: 1 })).toBe(false);
    expect(isDueForDaily({ periodDays: 2, daysLeft: 0 })).toBe(true);
  });

  it('냉동 품목은 일주일 전부터 넣는다', () => {
    expect(isDueForDaily({ periodDays: 90, daysLeft: 8 })).toBe(false);
    expect(isDueForDaily({ periodDays: 90, daysLeft: 7 })).toBe(true);
  });

  it('유통기한이 지난 품목은 매일 다시 알리지 않는다', () => {
    expect(isDueForDaily({ periodDays: 30, daysLeft: -1 })).toBe(false);
  });
});
