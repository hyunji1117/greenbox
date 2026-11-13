// app/lib/items/urgent.test.ts

import { describe, expect, it } from 'vitest';
import type { Item } from '@/app/lib/schemas/item';
import { pickUrgent } from './urgent';

const now = new Date(2026, 10, 13, 12);
const item = (name: string, overrides: Partial<Item> = {}) =>
  ({
    id: name,
    name,
    finished: false,
    quantity: 1,
    eatenQuantity: 0,
    category: 'fridge',
    ...overrides,
  }) as Item;

describe('pickUrgent', () => {
  it('유통기한 임박을 급한 순으로, 다 먹어 가는 것은 그 뒤에 둔다', () => {
    const result = pickUrgent(
      [
        item('계란', { quantity: 10, eatenQuantity: 9 }),
        item('우유', { expiryDate: '2026-11-15' }),
        item('두부', { expiryDate: '2026-11-12' }),
        item('김치', { expiryDate: '2026-12-30' }),
        item('사과', { quantity: 3, eatenQuantity: 1 }),
        item('버섯', { expiryDate: '2026-11-13', finished: true }),
      ],
      now,
    );
    expect(result.map(u => [u.item.name, u.label])).toEqual([
      ['두부', '1일 지남'],
      ['우유', '2일 남음'],
      ['계란', '1구 남음'],
    ]);
  });
});
