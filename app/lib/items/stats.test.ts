// app/lib/items/stats.test.ts

import { describe, expect, it } from 'vitest';
import type { Item } from '@/app/lib/schemas/item';
import { computeItemStats } from './stats';

const now = new Date(2026, 10, 1, 12);
const mom = { id: '1', name: '엄마', isMember: true };
const kid = { id: '2', name: '떡자', isMember: true };
const item = (overrides: Partial<Item> = {}) =>
  ({
    name: '품목',
    finished: false,
    category: 'fridge',
    addedBy: mom,
    ...overrides,
  }) as Item;

describe('computeItemStats', () => {
  it('다 먹은 품목은 집에 있는 수에서 빼고 따로 센다', () => {
    const stats = computeItemStats(
      [
        item(),
        item({ category: 'freezer' }),
        item({ category: 'pantry', finished: true }),
      ],
      now,
    );
    expect(stats.total).toBe(2);
    expect(stats.byCategory).toEqual({ fridge: 1, freezer: 1, pantry: 0 });
    expect(stats.finished).toBe(1);
  });

  it('유통기한을 지남, 3일 안, 넉넉함, 모름으로 나눈다', () => {
    const stats = computeItemStats(
      [
        item({ expiryDate: '2026-10-31' }),
        item({ expiryDate: '2026-11-01' }),
        item({ expiryDate: '2026-11-04' }),
        item({ expiryDate: '2026-11-05' }),
        item(),
      ],
      now,
    );
    expect(stats.expiry).toEqual({ expired: 1, soon: 2, later: 1, unknown: 1 });
  });

  it('넣은 사람별로 많은 순으로 세고, 탈퇴한 구성원은 한 줄로 모은다', () => {
    const left = { id: null, name: null, isMember: false };
    const stats = computeItemStats(
      [
        item({ addedBy: kid }),
        item({ addedBy: kid }),
        item(),
        item({ addedBy: left }),
        item({ addedBy: left }),
        item({ addedBy: kid, finished: true }),
      ],
      now,
    );
    expect(stats.byPerson).toEqual([
      { key: '2', label: '떡자', count: 2 },
      { key: 'left', label: '탈퇴한 구성원', count: 2 },
      { key: '1', label: '엄마', count: 1 },
    ]);
  });
});
