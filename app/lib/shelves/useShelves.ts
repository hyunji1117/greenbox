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
import { requestPromptAgain } from '@/app/lib/shelves/autoPlacePrompt';
import { requestShelfTourAgain } from '@/app/lib/shelves/shelfTour';
import { z } from 'zod';

const AutoPlaceResultSchema = z.object({ placed: z.number().int().min(0) });

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
      // 추가와 줄이기를 보고서에서 바로 나눠 보도록 방향(action)을 함께 보낸다 (GA4 맞춤 측정기준 action)
      track('shelf_count_changed', {
        category: input.category,
        count: settings.counts[input.category],
        action: input.action,
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
      // 정식 적용 전 베타 동안에는 켤 때마다 예전 식재료 배치 안내를 다시 띄운다
      if (settings.enabled) {
        requestPromptAgain();
        requestShelfTourAgain();
      }
      track('shelf_view_toggled', {
        view: settings.enabled ? 'shelf' : 'list',
        // 주인인지 나중에 들어온 가족인지, 몇 번째로 들어왔는지 (다음 베타 대상을 정할 때 참고)
        by: settings.myRole,
        join_rank: settings.myJoinRank,
      });
    },
  });
}

// 선반 보기 정식 전환: 선반 없이 들어가 있던 품목을 추천 자리에 놓는다 (서버가 이미 놓인 품목은 건드리지 않는다)
export function useAutoPlace() {
  const queryClient = useQueryClient();
  const fridgeId = useCurrentFridge().data?.id ?? '';
  return useMutation({
    mutationFn: () =>
      apiFetch(`${shelvesUrl(fridgeId)}/auto-place`, AutoPlaceResultSchema, {
        method: 'POST',
      }),
    onSuccess: ({ placed }) => {
      if (placed === 0) return;
      track('shelf_auto_placed', { count: placed });
      return queryClient.invalidateQueries({ queryKey: ['items'] });
    },
  });
}
