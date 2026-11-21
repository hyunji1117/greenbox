// app/lib/shelves/shelfTour.ts
// 선반 둘러보기: 냉장고 화면(1장)과 선반 목록(2~6장)을 이어서 지나가는 안내의 진행 상태 (2026-11-20)
// - 지금 몇 번째 장인지는 화면 조각이 바뀌어도 이어지도록 모듈에 둔다 (새로고침하면 처음부터가 아니라 끝난 것으로 본다)
// - 사람마다 한 번 (기기별로 기억). 정식 적용 전 베타 동안에는 선반 보기를 켤 때마다 다시 띄운다
// - 어디서든 나가면 그 자리에서 끝낸다 (중간에 끊긴 안내를 다시 띄우면 귀찮아서)

import { useSyncExternalStore } from 'react';

export const TOUR_LAST_STEP = 6;
// 2장("식재료 추가해요")에서 입력창을 누른 뒤, 실제로 하나 넣을 때까지 기다리는 상태
export const TOUR_WAIT_ADD = 20;
// 5장 먹음 뒤: 아래 알림의 되돌리기를 알려 주는 장 (알림은 이 장이 끝날 때까지 남겨 둔다)
export const TOUR_UNDO = 51;

let step: number | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(listener => listener());

export function useShelfTourStep(): number | null {
  return useSyncExternalStore(
    listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => step,
    () => null,
  );
}

export function setShelfTourStep(next: number | null) {
  step = next;
  emit();
}

const seenKey = (userId: string) => `greenbox_guide_shelf_tour_seen_${userId}`;
// 베타를 켰을 때 남긴다 (누가 켰든 이 기기에서 다시 보게)
const AGAIN_KEY = 'greenbox_guide_shelf_tour_again';

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function wantsShelfTour(userId: string): boolean {
  try {
    const store = storage();
    if (!store) return false;
    return (
      store.getItem(AGAIN_KEY) === '1' || store.getItem(seenKey(userId)) !== '1'
    );
  } catch {
    // 저장소를 막은 브라우저에서는 매번 뜨지 않도록 띄우지 않는다
    return false;
  }
}

// 끝까지 보았거나 중간에 나갔을 때
export function finishShelfTour(userId: string | undefined) {
  setShelfTourStep(null);
  if (!userId) return;
  try {
    storage()?.setItem(seenKey(userId), '1');
    storage()?.removeItem(AGAIN_KEY);
  } catch {
    // 저장하지 못해도 이번 화면에서는 끝낸다
  }
}

export function requestShelfTourAgain() {
  try {
    storage()?.setItem(AGAIN_KEY, '1');
  } catch {
    // 저장하지 못하면 다시 띄우지 않는다
  }
}

// 선반 목록에서 식재료를 넣었을 때 부른다. 2장에서 기다리던 중이면 다음 장으로 넘어간다
export function shelfTourItemAdded() {
  if (step === TOUR_WAIT_ADD) setShelfTourStep(3);
}

// 테스트에서 진행 상태를 비운다
export function resetShelfTourForTest() {
  step = null;
}
