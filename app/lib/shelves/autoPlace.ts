// app/lib/shelves/autoPlace.ts
// 선반 보기로 바뀐 냉장고에서, 선반 없이 들어가 있던 품목을 추천 자리에 놓는 계획 (서버와 테스트가 함께 쓴다)
// - 한 품목씩 추천 규칙(recommend.ts)으로 자리를 고르고, 고른 자리를 다음 품목의 계산에 바로 반영한다
//   (같은 선반에 몰려 넘치지 않게)
// - 추천 자리가 최대(냉장과 상온 30, 냉동 50)까지 찼으면 그 칸에서 가장 여유 있는 선반, 모두 찼으면 놓지 않는다
// - 다 먹은 품목은 놓지 않는다

import type { Item } from '@/app/lib/schemas/item';
import { recommendPlace, shelfLoads } from '@/app/lib/shelves/recommend';
import { SHELF_MAX, type ShelfCounts } from '@/app/lib/shelves/rules';

export type PlaceableItem = Pick<
  Item,
  'id' | 'name' | 'category' | 'shelf' | 'finished' | 'addedAt'
>;

export function planAutoPlacement(
  items: PlaceableItem[],
  counts: ShelfCounts,
): { id: string; shelf: number }[] {
  // 놓은 자리를 반영해 가며 계산할 품목 목록 (원본은 바꾸지 않는다)
  const placed: PlaceableItem[] = items.map(item => ({ ...item }));
  const plan: { id: string; shelf: number }[] = [];
  // 오래 넣은 것부터 놓는다
  const waiting = placed
    .filter(item => item.shelf === null && !item.finished)
    .sort(
      (a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime(),
    );
  for (const item of waiting) {
    const count = counts[item.category];
    const loads = shelfLoads(placed as Item[], item.category, count);
    const max = SHELF_MAX[item.category];
    let shelf = recommendPlace(
      item.name,
      item.category,
      counts,
      placed as Item[],
    ).shelf;
    if (loads[shelf - 1] >= max) {
      const open = loads
        .map((load, index) => ({ load, shelf: index + 1 }))
        .filter(entry => entry.load < max)
        .sort((a, b) => a.load - b.load)[0];
      if (!open) continue;
      shelf = open.shelf;
    }
    item.shelf = shelf;
    plan.push({ id: item.id, shelf });
  }
  return plan;
}
