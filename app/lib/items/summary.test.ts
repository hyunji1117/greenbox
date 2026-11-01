// app/lib/items/summary.test.ts

import { describe, expect, it } from 'vitest';
import type { Item } from '@/app/lib/schemas/item';
import { summarizeItems } from './summary';

const now = new Date(2026, 10, 1, 12);
const item = (
  name: string,
  expiryDate?: string,
  overrides: Partial<Item> = {},
) =>
  ({
    name,
    expiryDate,
    finished: false,
    category: 'fridge',
    ...overrides,
  }) as Item;

describe('summarizeItems', () => {
  it('다 먹은 품목은 세지 않고 칸별로 센다', () => {
    const summary = summarizeItems(
      [
        item('우유'),
        item('만두', undefined, { category: 'freezer' }),
        item('두부', '2026-11-02', { finished: true }),
      ],
      now,
    );

    expect(summary.total).toBe(2);
    expect(summary.byCategory).toEqual({ fridge: 1, freezer: 1, pantry: 0 });
    expect(summary.expiringFirst).toEqual([]);
  });

  it('유통기한이 가까운 순으로 3개까지 보여 주고 임박 품목 수를 센다', () => {
    const summary = summarizeItems(
      [
        item('네번째', '2026-11-20'),
        item('둘째', '2026-11-03'),
        item('지남', '2026-10-30'),
        item('셋째', '2026-11-10'),
        item('날짜없음'),
      ],
      now,
    );

    expect(summary.expiringFirst.map(({ item }) => item.name)).toEqual([
      '지남',
      '둘째',
      '셋째',
    ]);
    expect(summary.expiringSoonCount).toBe(2);
  });
});
