'use client';
// app/lib/shelves/useShelves.ts
// 선반 보기 베타 설정 조회와 변경 (화면용). 서버가 켜짐 여부를 정하고 화면은 따르기만 한다

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/app/lib/api/apiFetch';
import { useCurrentFridge } from '@/app/lib/fridges/useCurrentFridge';
import { shelfKeys } from '@/app/lib/query/keys';
import type { Category } from '@/app/lib/schemas/item';
import {
  ShelfSettingsSchema,
  type ShelfSettings,
} from '@/app/lib/schemas/shelves';
import { track } from '@/app/lib/analytics/gtag';

const shelvesUrl = (fridgeId: string) => `/api/fridges/${fridgeId}/shelves`;

export function useShelfSettings() {
  const fridgeId = useCurrentFridge().data?.id;
  return useQuery({
    queryKey: shelfKeys.settings(fridgeId ?? ''),
    queryFn: () => apiFetch(shelvesUrl(fridgeId!), ShelfSettingsSchema),
    enabled: Boolean(fridgeId),
  });
}

export function useChangeShelfCount() {
  const queryClient = useQueryClient();
  const fridgeId = useCurrentFridge().data?.id ?? '';
  return useMutation({
    mutationFn: (input: { category: Category; action: 'add' | 'remove' }) =>
      apiFetch(shelvesUrl(fridgeId), ShelfSettingsSchema, {
        method: 'PATCH',
        body: input,
      }),
    onSuccess: (settings, input) => {
      queryClient.setQueryData<ShelfSettings>(
        shelfKeys.settings(fridgeId),
        settings,
      );
      track('shelf_count_changed', {
        category: input.category,
        count: settings.counts[input.category],
      });
      // 선반을 빼면 아래 품목의 선반 번호가 한 칸씩 올라가므로 품목도 다시 읽는다
      if (input.action === 'remove') {
        return queryClient.invalidateQueries({ queryKey: ['items'] });
      }
    },
  });
}

export function useSetShelfView() {
  const queryClient = useQueryClient();
  const fridgeId = useCurrentFridge().data?.id ?? '';
  return useMutation({
    mutationFn: (enabled: boolean) =>
      apiFetch(`${shelvesUrl(fridgeId)}/view`, ShelfSettingsSchema, {
        method: 'PUT',
        body: { enabled },
      }),
    onSuccess: settings => {
      queryClient.setQueryData<ShelfSettings>(
        shelfKeys.settings(fridgeId),
        settings,
      );
      track('shelf_view_toggled', {
        view: settings.enabled ? 'shelf' : 'list',
        by: 'owner_switch',
      });
    },
  });
}
