// app/lib/items/urgent.ts
// 선반 보기 아래 "빨리 먹어야 할 식재료": 유통기한이 3일 안(지난 것 포함)인 것을 급한 순으로,
// 그다음 2개 이상 샀는데 1개 이하로 남은 것(다 먹어 가는 것)

import {
  daysUntilExpiry,
  EXPIRY_SOON_DAYS,
  expiryLabel,
} from '@/app/lib/items/expiry';
import type { Item } from '@/app/lib/schemas/item';
import { withUnit } from '@/app/lib/items/units';

export const MAX_URGENT = 12;

export interface Urgent {
  item: Item;
  label: string;
  isExpiry: boolean;
}

// 다 먹어 가는 것은 유통기한 임박보다 뒤에 둔다
const LOW_STOCK_ORDER = 100;

export function pickUrgent(items: Item[], now = new Date()): Urgent[] {
  const list: (Urgent & { order: number })[] = [];
  for (const item of items) {
    if (item.finished) continue;
    const remaining = item.quantity - item.eatenQuantity;
    const days = item.expiryDate ? daysUntilExpiry(item.expiryDate, now) : null;
    if (days !== null && days <= EXPIRY_SOON_DAYS) {
      list.push({
        item,
        label: expiryLabel(days),
        isExpiry: true,
        order: days,
      });
    } else if (item.quantity >= 2 && remaining <= 1) {
      list.push({
        item,
        label: `${withUnit(remaining, item.name)} 남음`,
        isExpiry: false,
        order: LOW_STOCK_ORDER,
      });
    }
  }
  return list
    .sort((a, b) => a.order - b.order)
    .slice(0, MAX_URGENT)
    .map(({ item, label, isExpiry }) => ({ item, label, isExpiry }));
}
