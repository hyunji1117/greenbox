// app/lib/notifications/leadTime.test.ts

import { describe, expect, it } from 'vitest';
import { isDueForDaily, leadDays } from './leadTime';

describe('leadDays', () => {
  it('기본은 3일 전부터, 60일 넘게 두는 품목은 7일 전부터 알린다', () => {
    expect(leadDays(2)).toBe(3);
    expect(leadDays(14)).toBe(3);
    expect(leadDays(60)).toBe(3);
    expect(leadDays(61)).toBe(7);
    expect(leadDays(365)).toBe(7);
  });
});

describe('isDueForDaily', () => {
  it('바로 꺼내기에 보이는 품목(3일 안)은 보관 기간과 상관없이 모두 넣는다', () => {
    // 훈제연어(2일 보관, 1일 남음), 양상추(4일 보관, 2일 남음), 깻잎(4일 보관, 3일 남음)
    expect(isDueForDaily({ periodDays: 2, daysLeft: 1 })).toBe(true);
    expect(isDueForDaily({ periodDays: 4, daysLeft: 2 })).toBe(true);
    expect(isDueForDaily({ periodDays: 4, daysLeft: 3 })).toBe(true);
    expect(isDueForDaily({ periodDays: 10, daysLeft: 4 })).toBe(false);
  });

  it('냉동 품목은 일주일 전부터 넣는다', () => {
    expect(isDueForDaily({ periodDays: 90, daysLeft: 8 })).toBe(false);
    expect(isDueForDaily({ periodDays: 90, daysLeft: 7 })).toBe(true);
  });

  it('유통기한이 지난 품목은 매일 다시 알리지 않는다', () => {
    expect(isDueForDaily({ periodDays: 30, daysLeft: -1 })).toBe(false);
  });
});
