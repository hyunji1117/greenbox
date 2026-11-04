// app/lib/fridges/useCurrentFridge.ts
// 지금 보고 있는 냉장고. 품목 훅은 이 냉장고 번호로 목록을 불러오고 저장한다

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/app/lib/api/apiFetch';
import { fridgeKeys } from '@/app/lib/query/keys';
import { CurrentFridgeSchema } from '@/app/lib/schemas/fridge';

export const CURRENT_FRIDGE_URL = '/api/fridges/current';

export function useCurrentFridge() {
  return useQuery({
    queryKey: fridgeKeys.current(),
    queryFn: () => apiFetch(CURRENT_FRIDGE_URL, CurrentFridgeSchema),
  });
}
