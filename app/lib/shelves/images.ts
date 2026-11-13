// app/lib/shelves/images.ts
// 선반 스티커에 쓸 식재료 사진. 장보기 "자주 사는 식재료"의 사진(public/)을 이름으로 찾아 다시 쓴다
// 같은 재료의 다른 이름(계란/달걀)도 찾는다. 사진이 없으면 null (화면은 첫 글자 타일로 보여 준다)
// 나중 작업: 매달 사용자 냉장고에서 자주 쓰는 품목을 모아 사진을 더한다

import { mockItems } from '@/app/data/mockItems';
import { matchScore } from '@/app/lib/items/nameMatch';

export function imageForName(name: string): string | null {
  let best: { url: string; score: number } | null = null;
  for (const item of mockItems) {
    const score = matchScore(item.name, name);
    // 같은 이름이거나 앞부분이 같을 때만 쓴다 (안에 들어 있기만 한 이름은 다른 재료일 수 있다)
    if (score === null || score > 1) continue;
    if (!best || score < best.score) best = { url: item.imageUrl, score };
  }
  return best?.url ?? null;
}
