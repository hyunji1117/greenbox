// app/lib/notifications/schedule.test.ts

import { describe, expect, it } from 'vitest';
import { isDueHour, koreaClock, minutesPastHour } from './schedule';

describe('koreaClock', () => {
  it('UTC 시각을 한국 날짜, 시각, 요일로 바꾼다', () => {
    // 2026-11-06(금) 23:10 UTC = 2026-11-07(토) 08:10 KST
    expect(koreaClock(new Date('2026-11-06T23:10:00Z'))).toEqual({
      date: '2026-11-07',
      hour: 8,
      day: 6,
    });
  });

  it('한국 자정 직전과 직후를 구분한다', () => {
    expect(koreaClock(new Date('2026-11-06T14:59:00Z')).date).toBe(
      '2026-11-06',
    );
    expect(koreaClock(new Date('2026-11-06T15:00:00Z'))).toMatchObject({
      date: '2026-11-07',
      hour: 0,
    });
  });
});

describe('isDueHour', () => {
  it('정한 시각부터 2시간 안에는 보낼 차례로 본다 (늦거나 건너뛴 실행 대비)', () => {
    expect(isDueHour(8, 7)).toBe(false);
    expect(isDueHour(8, 8)).toBe(true);
    expect(isDueHour(8, 10)).toBe(true);
    expect(isDueHour(8, 11)).toBe(false);
  });
});

describe('minutesPastHour', () => {
  it('정각에서 몇 분 늦게 실행됐는지 돌려준다', () => {
    expect(minutesPastHour(new Date('2026-11-06T23:07:30Z'))).toBe(7);
  });
});
