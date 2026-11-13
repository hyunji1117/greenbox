// app/lib/shelves/rules.ts
// 냉장고 모양 선반 보기 베타의 규칙 (docs/decisions/0012-shelf-view-beta.md). 화면과 서버가 같은 값을 쓴다

import type { Category } from '@/app/lib/schemas/item';

export const SHELF_VIEW_EXPERIMENT = 'shelf_view';
export const DEFAULT_SHELF_COUNT = 5;
export const MIN_SHELF_COUNT = 1;
export const MAX_SHELF_COUNT = 7;
// 한 선반에 넣을 수 있는 품목 수 (다 먹은 품목은 세지 않는다)
export const MAX_ITEMS_PER_SHELF = 20;
// 선반 화면에 스티커처럼 붙여 보여 주는 수. 나머지는 "+N"
export const STICKERS_PER_SHELF = 10;

export type ShelfCounts = Record<Category, number>;

export const DEFAULT_SHELF_COUNTS: ShelfCounts = {
  fridge: DEFAULT_SHELF_COUNT,
  freezer: DEFAULT_SHELF_COUNT,
  pantry: DEFAULT_SHELF_COUNT,
};

// 줄일 선반: 아래쪽부터 찾은 첫 빈 선반. 빈 선반이 없거나 이미 최소면 null
// occupied: 품목이 하나라도 있는 선반 번호들
export function shelfToRemove(
  shelfCount: number,
  occupied: ReadonlySet<number>,
): number | null {
  if (shelfCount <= MIN_SHELF_COUNT) return null;
  for (let shelf = shelfCount; shelf >= 1; shelf -= 1) {
    if (!occupied.has(shelf)) return shelf;
  }
  return null;
}

// 선반에 붙일 스티커: 사진이 있는 품목을 먼저, 그 안에서는 유통기한이 가까운 순. 최대 STICKERS_PER_SHELF개
export function pickStickers<T extends { expiryDate: string | null }>(
  items: readonly T[],
  hasImage: (item: T) => boolean,
): { shown: T[]; hidden: number } {
  const sorted = [...items].sort((a, b) => {
    const image = Number(hasImage(b)) - Number(hasImage(a));
    if (image !== 0) return image;
    return (a.expiryDate ?? '9999').localeCompare(b.expiryDate ?? '9999');
  });
  return {
    shown: sorted.slice(0, STICKERS_PER_SHELF),
    hidden: Math.max(0, sorted.length - STICKERS_PER_SHELF),
  };
}
