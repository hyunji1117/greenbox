// app/lib/items/stats.ts
// 통계 화면 수치. 지금 냉장고에 실제로 있는 품목만으로 계산한다 (예시 데이터 없음)

import { daysUntilExpiry, EXPIRY_SOON_DAYS } from '@/app/lib/items/expiry';
import type { Category, Item } from '@/app/lib/schemas/item';
import { personLabel } from '@/app/lib/user/displayName';

export interface PersonCount {
  // 탈퇴한 구성원은 id가 없어 한 줄로 모은다
  key: string;
  label: string;
  count: number;
}

export interface ItemStats {
  // 집에 있는 품목 (다 먹은 품목 제외)
  total: number;
  byCategory: Record<Category, number>;
  expiry: {
    expired: number;
    // 오늘부터 3일 안
    soon: number;
    later: number;
    unknown: number;
  };
  // 다 먹음으로 표시한 품목
  finished: number;
  // 집에 있는 품목을 누가 넣었는지. 많은 순
  byPerson: PersonCount[];
}

export function computeItemStats(items: Item[], now = new Date()): ItemStats {
  const inFridge = items.filter(item => !item.finished);
  const expiry = { expired: 0, soon: 0, later: 0, unknown: 0 };
  const byCategory: Record<Category, number> = {
    fridge: 0,
    freezer: 0,
    pantry: 0,
  };
  const people = new Map<string, PersonCount>();

  for (const item of inFridge) {
    byCategory[item.category] += 1;

    if (item.expiryDate === undefined) {
      expiry.unknown += 1;
    } else {
      const days = daysUntilExpiry(item.expiryDate, now);
      if (days < 0) expiry.expired += 1;
      else if (days <= EXPIRY_SOON_DAYS) expiry.soon += 1;
      else expiry.later += 1;
    }

    const key = item.addedBy.id ?? 'left';
    const person = people.get(key);
    if (person) person.count += 1;
    else people.set(key, { key, label: personLabel(item.addedBy), count: 1 });
  }

  return {
    total: inFridge.length,
    byCategory,
    expiry,
    finished: items.length - inFridge.length,
    byPerson: [...people.values()].sort((a, b) => b.count - a.count),
  };
}
