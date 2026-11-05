// app/lib/fridges/useCurrentFridge.ts
// 지금 보고 있는 냉장고. 품목 훅은 이 냉장고 번호로 목록을 불러오고 저장한다

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/app/lib/api/apiFetch';
import { fridgeKeys } from '@/app/lib/query/keys';
import {
  CurrentFridgeSchema,
  type CurrentFridge,
} from '@/app/lib/schemas/fridge';

export const CURRENT_FRIDGE_URL = '/api/fridges/current';

// 다른 가족의 참여 요청, 승인, 내보내기가 새로고침 없이 보이도록 화면이 보이는 동안 다시 확인한다
// (탭이 뒤에 있으면 멈추고, 돌아오면 바로 확인한다)
export const SHARING_REFRESH_MS = 10_000;

export function useCurrentFridge() {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: fridgeKeys.current(),
    // 보고 있는 냉장고를 함께 보내 다시 확인하는 동안 화면이 다른 냉장고로 바뀌지 않게 한다
    // (내보내져 구성원이 아니게 되면 서버가 내가 속한 다른 냉장고를 돌려준다)
    queryFn: () => {
      const shown = queryClient.getQueryData<CurrentFridge>(
        fridgeKeys.current(),
      )?.id;
      const url = shown
        ? `${CURRENT_FRIDGE_URL}?keep=${encodeURIComponent(shown)}`
        : CURRENT_FRIDGE_URL;
      return apiFetch(url, CurrentFridgeSchema);
    },
    refetchInterval: SHARING_REFRESH_MS,
  });
}
