// app/lib/items/addedPlace.ts
// 식재료를 넣은 뒤 "어디에 들어갔는지"를 알려 주는 문구와, 보여 줄 칸을 정한다
// 가족 관찰(2026-11-10): 냉동실에 들어간 새우를 냉장실 탭에서 찾지 못해 "등록된 게 없다"고 느끼고 다시 넣음

import type { Category } from '@/app/lib/schemas/item';

export const CATEGORY_NAME: Record<Category, string> = {
  fridge: '냉장실',
  freezer: '냉동실',
  pantry: '상온',
};

// "기흥 냉장고 냉동실". 냉장고 이름을 모르면 칸 이름만 쓴다
export function placeLabel(
  fridgeName: string | undefined,
  category: Category,
): string {
  const name = fridgeName?.trim();
  return name ? `${name} ${CATEGORY_NAME[category]}` : CATEGORY_NAME[category];
}

// 넣은 품목이 지금 보는 칸에 하나라도 있으면 그대로 두고, 모두 다른 칸이면 첫 품목의 칸을 보여 준다
export function categoryToShow(
  current: Category,
  added: readonly Category[],
): Category | null {
  if (added.length === 0 || added.includes(current)) return null;
  return added[0];
}

// 사진으로 여러 개를 넣었을 때. 한 칸이면 "기흥 냉장고 냉동실에 2개를 넣었어요",
// 여러 칸이면 "기흥 냉장고에 냉장실 2개, 냉동실 1개를 넣었어요"
export function addedPlaceMessage(
  fridgeName: string | undefined,
  added: readonly Category[],
): string {
  const counts = new Map<Category, number>();
  for (const category of added) {
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  if (counts.size === 1) {
    const [category, count] = [...counts][0];
    return `${placeLabel(fridgeName, category)}에 ${count}개를 넣었어요`;
  }
  const parts = [...counts]
    .map(([category, count]) => `${CATEGORY_NAME[category]} ${count}개`)
    .join(', ');
  const name = fridgeName?.trim();
  return name ? `${name}에 ${parts}를 넣었어요` : `${parts}를 넣었어요`;
}
