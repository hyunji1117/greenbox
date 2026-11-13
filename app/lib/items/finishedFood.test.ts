// app/lib/items/finishedFood.test.ts

import { describe, expect, it } from 'vitest';
import type { Item } from '@/app/lib/schemas/item';
import {
  restoreUpdates,
  scatterPositions,
  splitFinished,
} from './finishedFood';

const now = new Date('2026-11-13T12:00:00+09:00');
const item = (name: string, overrides: Partial<Item> = {}) =>
  ({
    id: name,
    name,
    quantity: 3,
    eatenQuantity: 0,
    finished: true,
    addedAt: new Date('2026-11-01T00:00:00Z'),
    updatedAt: new Date('2026-11-12T00:00:00Z'),
    ...overrides,
  }) as Item;

describe('splitFinished', () => {
  it('다 먹은 것과 버린 것을 나누고, 최근 30일 안의 것만 최근 순으로 둔다', () => {
    const { eaten, discarded } = splitFinished(
      [
        item('계란', { eatenQuantity: 3 }),
        item('두부', {
          eatenQuantity: 3,
          updatedAt: new Date('2026-11-13T00:00:00Z'),
        }),
        item('우유', { eatenQuantity: 1 }),
        item('오래된 김치', {
          eatenQuantity: 3,
          updatedAt: new Date('2026-10-01T00:00:00Z'),
        }),
        item('냉장고에 있는 사과', { finished: false }),
      ],
      now,
    );
    expect(eaten.map(i => i.name)).toEqual(['두부', '계란']);
    expect(discarded.map(i => i.name)).toEqual(['우유']);
  });
});

describe('restoreUpdates', () => {
  it('다 먹은 것은 1개 남은 것으로, 버린 것은 버릴 때 수량 그대로 꺼낸다', () => {
    expect(
      restoreUpdates(item('계란', { quantity: 30, eatenQuantity: 30 })),
    ).toEqual({
      finished: false,
      eatenQuantity: 29,
    });
    expect(restoreUpdates(item('우유', { eatenQuantity: 1 }))).toEqual({
      finished: false,
    });
  });
});

describe('scatterPositions', () => {
  it('모든 자리가 0~1 안에 있다', () => {
    for (const { x, y } of scatterPositions(24)) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(1);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(1);
    }
  });
});
