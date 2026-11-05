// app/lib/storage/usePurchaseHistory.ts
// 이 기기에서 장보기를 완료한 기록 (IndexedDB). 장보기 탭의 구매 횟수와 통계 탭의 자주 산 품목에 쓴다

'use client';

import { useCallback, useEffect, useState } from 'react';
import purchaseStorage, {
  type PurchaseHistory,
} from '@/app/lib/storage/PurchaseDataStorage';

export function usePurchaseHistory() {
  const [history, setHistory] = useState<PurchaseHistory[] | null>(null);
  const [failed, setFailed] = useState(false);

  const reload = useCallback(async () => {
    try {
      setHistory(await purchaseStorage.getAllPurchaseHistory());
      setFailed(false);
    } catch (error) {
      // 사생활 보호 모드 등에서 IndexedDB를 막으면 기록 없이 보여 준다
      console.error('구매 기록을 불러오지 못했습니다:', error);
      setHistory([]);
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    // 화면이 붙은 뒤 한 번 읽는다 (IndexedDB는 브라우저에만 있다)
    void reload();
  }, [reload]);

  return { history, failed, reload };
}

export function toPurchaseCounts(
  history: PurchaseHistory[] | null,
): Map<string, number> {
  return new Map((history ?? []).map(h => [h.itemName, h.purchaseCount]));
}
