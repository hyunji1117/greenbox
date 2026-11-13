// app/lib/items/finishedFood.ts
// 통계의 "먹은 음식(위)"과 "버린 음식(쓰레기통)". 시간이 지나도 실수로 누른 것을 냉장고로 꺼낼 수 있게 한다
// 먹음은 먹은 개수를 산 수량으로 채우고, 버림은 먹은 개수를 그대로 두므로 그 차이로 나눈다 (따로 저장하는 칸이 없다)

import type { Item } from '@/app/lib/schemas/item';

// 최근 이 기간 안에 다 먹거나 버린 것만 보여 준다
export const FINISHED_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export const isEatenUp = (item: Item) => item.eatenQuantity >= item.quantity;

export function splitFinished(
  items: Item[],
  now = new Date(),
): { eaten: Item[]; discarded: Item[] } {
  const since = now.getTime() - FINISHED_WINDOW_DAYS * DAY_MS;
  const recent = items
    .filter(item => item.finished)
    // 마지막으로 바뀐 때를 모르는 예전 응답은 넣은 때로 본다
    .map(item => ({ item, at: (item.updatedAt ?? item.addedAt).getTime() }))
    .filter(({ at }) => at >= since)
    .sort((a, b) => b.at - a.at)
    .map(({ item }) => item);
  return {
    eaten: recent.filter(isEatenUp),
    discarded: recent.filter(item => !isEatenUp(item)),
  };
}

// 냉장고로 꺼낼 때 바꿀 값. 다 먹은 것은 먹기 전에 몇 개 남았는지 저장돼 있지 않아 1개 남은 것으로 꺼내고,
// 버린 것은 버릴 때 남아 있던 수량 그대로 꺼낸다
export function restoreUpdates(item: Item): {
  finished: false;
  eatenQuantity?: number;
} {
  return isEatenUp(item)
    ? { finished: false, eatenQuantity: item.quantity - 1 }
    : { finished: false };
}

// 위나 쓰레기통 안에 음식을 흩어 놓을 자리 (0~1 비율). 해바라기 씨처럼 고르게 퍼지는 황금각 나선
export function scatterPositions(count: number): { x: number; y: number }[] {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    const r = Math.sqrt((i + 0.5) / Math.max(count, 1));
    const angle = i * golden;
    return {
      x: 0.5 + 0.5 * r * Math.cos(angle),
      y: 0.5 + 0.5 * r * Math.sin(angle),
    };
  });
}
