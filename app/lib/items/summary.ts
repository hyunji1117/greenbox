// app/lib/items/summary.ts
// 홈 요약. 다 먹거나 버린 품목은 집에 없으므로 세지 않는다

import { daysUntilExpiry, EXPIRY_SOON_DAYS } from '@/app/lib/items/expiry';
import type { Category, Item } from '@/app/lib/schemas/item';

export const MAX_EXPIRING_ITEMS = 3;

export interface ItemSummary {
  total: number;
  expiringSoonCount: number;
  byCategory: Record<Category, number>;
  // 유통기한이 가까운 순. 유통기한을 넣지 않은 품목은 제외한다
  expiringFirst: Array<{ item: Item; days: number }>;
}

export function summarizeItems(items: Item[], now = new Date()): ItemSummary {
  const inFridge = items.filter(item => !item.finished);
  const withExpiry = inFridge
    .flatMap(item =>
      item.expiryDate === undefined
        ? []
        : [{ item, days: daysUntilExpiry(item.expiryDate, now) }],
    )
    .sort((a, b) => a.days - b.days);
  const countIn = (category: Category) =>
    inFridge.filter(item => item.category === category).length;

  return {
    total: inFridge.length,
    expiringSoonCount: withExpiry.filter(({ days }) => days <= EXPIRY_SOON_DAYS)
      .length,
    byCategory: {
      fridge: countIn('fridge'),
      freezer: countIn('freezer'),
      pantry: countIn('pantry'),
    },
    expiringFirst: withExpiry.slice(0, MAX_EXPIRING_ITEMS),
  };
}
