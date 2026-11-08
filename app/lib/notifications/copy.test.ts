// app/lib/notifications/copy.test.ts

import { describe, expect, it } from 'vitest';
import { assignVariant, buildSummary, summaryUrl } from './copy';

describe('assignVariant', () => {
  it('같은 사람, 같은 날, 같은 알림이면 늘 같은 문구를 준다', () => {
    expect(assignVariant('7', '2026-11-09', 'daily')).toBe(
      assignVariant('7', '2026-11-09', 'daily'),
    );
  });

  it('사람과 날짜를 섞어 두 문구가 고르게 나뉜다', () => {
    let a = 0;
    let total = 0;
    for (let user = 1; user <= 40; user += 1) {
      for (let day = 1; day <= 30; day += 1) {
        const date = `2026-11-${String(day).padStart(2, '0')}`;
        if (assignVariant(String(user), date, 'daily') === 'A') a += 1;
        total += 1;
      }
    }
    expect(a / total).toBeGreaterThan(0.45);
    expect(a / total).toBeLessThan(0.55);
  });

  it('한 사람도 날마다 두 문구를 번갈아 받는다', () => {
    const seen = new Set(
      Array.from({ length: 14 }, (_, i) =>
        assignVariant(
          '1',
          `2026-11-${String(i + 1).padStart(2, '0')}`,
          'daily',
        ),
      ),
    );
    expect(seen).toEqual(new Set(['A', 'B']));
  });
});

describe('buildSummary', () => {
  it('A는 안내형, B는 오늘 할 일을 묻는 문구로 만든다', () => {
    expect(buildSummary('daily', ['우유'], 'A')).toEqual({
      title: '곧 먹어야 할 식재료가 있어요',
      body: '우유의 유통기한이 다가와요',
    });
    expect(buildSummary('daily', ['우유'], 'B')).toEqual({
      title: '오늘은 우유 먼저 먹어 볼까요?',
      body: '유통기한 전에 꺼내 두면 좋아요',
    });
    expect(buildSummary('weekly', ['우유', '두부', '달걀'], 'B').body).toBe(
      '우유 외 2개, 일주일 안에 먹으면 같은 걸 또 사지 않아도 돼요',
    );
  });

  it('보낸 날을 알면 냉장고 탭과 알림 정보를 담은 주소를 붙인다', () => {
    expect(buildSummary('daily', ['우유'], 'A', '2026-11-09').url).toBe(
      summaryUrl('daily', 'A', '2026-11-09'),
    );
    expect(summaryUrl('weekly', 'B', '2026-11-14')).toBe(
      '/?tab=fridge&from=push&kind=weekly&v=B&d=2026-11-14',
    );
  });
});
