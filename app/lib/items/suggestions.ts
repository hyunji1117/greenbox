// app/lib/items/suggestions.ts
// 빠른 추가 추천. 집에 있는 것을 등록할 기본 목록과, 전에 먹어서 다시 살 만한 품목을 나눈다

import type { Category, Item } from '@/app/lib/schemas/item';

const HOME_SUGGESTIONS: Record<Category, string[]> = {
  fridge: ['우유', '계란', '두부', '당근', '양파', '요거트'],
  freezer: ['만두', '아이스크림', '냉동밥', '새우', '소시지', '블루베리'],
  pantry: ['라면', '쌀', '참치캔', '올리브유', '파스타', '김'],
};

export const MAX_HOME_SUGGESTIONS = 6;
export const MAX_REBUY_SUGGESTIONS = 4;

const namesIn = (items: Item[]) => new Set(items.map(item => item.name));

const inCategory = (items: Item[], category: Category) =>
  items.filter(item => item.category === category);

const notFinished = (items: Item[]) => items.filter(item => !item.finished);

export function getHomeSuggestions(
  items: Item[],
  category: Category,
  query = '',
): string[] {
  const inFridge = namesIn(notFinished(inCategory(items, category)));
  const keyword = query.trim();
  return HOME_SUGGESTIONS[category]
    .filter(name => !inFridge.has(name) && name.includes(keyword))
    .slice(0, MAX_HOME_SUGGESTIONS);
}

// items는 추가된 최신순이다. 소진 시각은 저장하지 않아 이 순서를 그대로 쓴다
export function getRebuySuggestions(
  items: Item[],
  category: Category,
  query = '',
): string[] {
  const sameCategory = inCategory(items, category);
  const inFridge = namesIn(notFinished(sameCategory));
  const keyword = query.trim();
  const finished = sameCategory
    .filter(item => item.finished)
    .map(item => item.name);
  return [...new Set(finished)]
    .filter(name => !inFridge.has(name) && name.includes(keyword))
    .slice(0, MAX_REBUY_SUGGESTIONS);
}
