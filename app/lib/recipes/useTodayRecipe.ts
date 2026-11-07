// app/lib/recipes/useTodayRecipe.ts
// 홈 카드의 오늘의 초간단 레시피 훅. 보는 것은 무료(저장된 것만), 만들기는 버튼을 눌렀을 때만

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/app/lib/api/apiFetch';
import { track } from '@/app/lib/analytics/gtag';
import { useCurrentFridge } from '@/app/lib/fridges/useCurrentFridge';
import { itemKeys } from '@/app/lib/query/keys';
import {
  RecipeSchema,
  TodayRecipeSchema,
  type TodayRecipe,
} from '@/app/lib/schemas/recipe';

const todayKey = (fridgeId: string) => ['recipes', 'today', fridgeId] as const;

export function useTodayRecipe() {
  const fridgeId = useCurrentFridge().data?.id;
  return useQuery({
    queryKey: todayKey(fridgeId ?? ''),
    queryFn: () =>
      apiFetch(
        `/api/recipes/today?fridgeId=${encodeURIComponent(fridgeId!)}`,
        TodayRecipeSchema,
      ),
    enabled: Boolean(fridgeId),
  });
}

export function useMakeRecipe() {
  const queryClient = useQueryClient();
  const fridgeId = useCurrentFridge().data?.id;
  return useMutation({
    mutationFn: () =>
      apiFetch('/api/recipes/today', RecipeSchema, {
        method: 'POST',
        body: { fridgeId },
      }),
    onSuccess: recipe => {
      track('recipe_made');
      queryClient.setQueryData<TodayRecipe>(todayKey(fridgeId ?? ''), prev =>
        prev && prev.available ? { ...prev, recipe } : prev,
      );
    },
  });
}

// 다 만든 뒤 사용한 품목을 "다 먹음"으로 바꾸면 홈의 곧 먹어야 할 재료와 레시피도 다시 확인한다
export function useRefreshAfterCooking() {
  const queryClient = useQueryClient();
  const fridgeId = useCurrentFridge().data?.id ?? '';
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: itemKeys.list(fridgeId) }),
      queryClient.invalidateQueries({ queryKey: todayKey(fridgeId) }),
    ]);
}

export const recipeImageUrl = (recipeId: string, slot: number) =>
  `/api/recipes/${encodeURIComponent(recipeId)}/image/${slot}`;
