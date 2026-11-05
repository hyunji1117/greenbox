// app/lib/notifications/useNotifications.ts
// 알림 설정, 냉장고별 알림 수준, 관심 품목(종 버튼) 훅
// 모두 결과를 바로 예상할 수 있는 변경이라 화면에 먼저 반영하고, 실패하면 되돌린다

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiFetch } from '@/app/lib/api/apiFetch';
import { track } from '@/app/lib/analytics/gtag';
import { useCurrentFridge } from '@/app/lib/fridges/useCurrentFridge';
import { fridgeKeys, itemKeys, notificationKeys } from '@/app/lib/query/keys';
import type { CurrentFridge } from '@/app/lib/schemas/fridge';
import type { Item } from '@/app/lib/schemas/item';
import {
  NotificationSettingsResponseSchema,
  type NotificationSettingsResponse,
  type NotifyLevel,
  type UpdateNotificationSettings,
} from '@/app/lib/schemas/notifications';

const SETTINGS_URL = '/api/me/notifications';
// 204 응답은 본문이 없어 null로 읽힌다
const NoContent = z.null();

export function useNotificationSettings() {
  return useQuery({
    queryKey: notificationKeys.settings(),
    queryFn: () => apiFetch(SETTINGS_URL, NotificationSettingsResponseSchema),
  });
}

export type SettingsSource = 'first' | 'settings';

export function useUpdateNotificationSettings(source: SettingsSource) {
  const queryClient = useQueryClient();
  const key = notificationKeys.settings();
  return useMutation({
    mutationFn: (input: UpdateNotificationSettings) =>
      apiFetch(SETTINGS_URL, NotificationSettingsResponseSchema, {
        method: 'PATCH',
        body: input,
      }),
    onMutate: async input => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous =
        queryClient.getQueryData<NotificationSettingsResponse>(key);
      if (previous) {
        queryClient.setQueryData<NotificationSettingsResponse>(key, {
          settings: { ...previous.settings, ...input },
          saved: true,
        });
      }
      return { previous };
    },
    onSuccess: (saved, input) => {
      if (input.dailyHour !== undefined) {
        track('summary_time_changed', { kind: 'daily', source });
      }
      if (input.weeklyDay !== undefined || input.weeklyHour !== undefined) {
        track('summary_time_changed', { kind: 'weekly', source });
      }
      queryClient.setQueryData(key, saved);
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
  });
}

export interface NotifyLevelVariables {
  level: NotifyLevel;
  source: 'first' | 'settings' | 'skip';
}

// 지금 보고 있는 냉장고의 내 알림 수준
export function useSetNotifyLevel() {
  const queryClient = useQueryClient();
  const fridgeId = useCurrentFridge().data?.id;
  const key = fridgeKeys.current();
  return useMutation({
    mutationFn: ({ level }: NotifyLevelVariables) => {
      if (!fridgeId)
        throw new Error('냉장고를 불러오기 전에는 바꿀 수 없습니다');
      return apiFetch(
        `/api/fridges/${encodeURIComponent(fridgeId)}/notify-level`,
        NoContent,
        { method: 'PUT', body: { level } },
      );
    },
    onMutate: async ({ level }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CurrentFridge>(key);
      if (previous) {
        queryClient.setQueryData<CurrentFridge>(key, {
          ...previous,
          myNotifyLevel: level,
        });
      }
      return { previous };
    },
    onSuccess: (_data, { level, source }) => {
      track('notify_level_selected', { level, source });
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
  });
}

// 종 버튼. 같은 품목을 빠르게 여러 번 눌러도 요청이 순서대로 가도록 품목마다 묶는다
export function useToggleWatch(itemId: string) {
  const queryClient = useQueryClient();
  const fridgeId = useCurrentFridge().data?.id;
  const listKey = itemKeys.list(fridgeId ?? '');
  const setWatched = (watched: boolean) =>
    queryClient.setQueryData<Item[]>(listKey, items =>
      items?.map(item => (item.id === itemId ? { ...item, watched } : item)),
    );
  return useMutation({
    scope: { id: `item-watch-${itemId}` },
    mutationFn: (watched: boolean) =>
      apiFetch(`/api/items/${encodeURIComponent(itemId)}/watch`, NoContent, {
        method: watched ? 'PUT' : 'DELETE',
      }),
    onMutate: watched => {
      setWatched(watched);
    },
    onSuccess: (_data, watched) => track('item_watch_toggled', { watched }),
    onError: (_error, watched) => setWatched(!watched),
  });
}
