// app/lib/items/useItems.ts
// 냉장고 품목 서버 상태 훅. 화면은 fetch와 캐시를 몰라도 이 훅만 쓰면 된다.

'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { apiFetch } from '@/app/lib/api/apiFetch';
import { itemKeys } from '@/app/lib/query/keys';
import {
  ItemListSchema,
  ItemSchema,
  type CreateItemInput,
  type Item,
  type UpdateItemInput,
} from '@/app/lib/schemas/item';

const ITEMS_URL = '/api/items';
const UPDATE_MUTATION_KEY = [...itemKeys.all, 'update'] as const;

export function useItems() {
  return useQuery({
    queryKey: itemKeys.list(),
    queryFn: ({ signal }) => apiFetch(ITEMS_URL, ItemListSchema, { signal }),
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateItemInput) =>
      apiFetch(ITEMS_URL, ItemSchema, { method: 'POST', body: input }),
    onSuccess: () => invalidateList(queryClient),
  });
}

export interface UpdateItemVariables {
  id: string;
  updates: UpdateItemInput;
}

// 수량 변경과 소진처럼 결과를 바로 예상할 수 있는 변경이라 낙관적으로 먼저 반영한다
export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: UPDATE_MUTATION_KEY,
    mutationFn: ({ id, updates }: UpdateItemVariables) =>
      apiFetch(`${ITEMS_URL}/${id}`, ItemSchema, {
        method: 'PATCH',
        body: updates,
      }),
    onMutate: async ({ id, updates }) => {
      // 진행 중인 조회가 끝나면서 낙관적 값을 덮어쓰지 않도록 취소한다
      await queryClient.cancelQueries({ queryKey: itemKeys.list() });
      const previous = queryClient
        .getQueryData<Item[]>(itemKeys.list())
        ?.find(item => item.id === id);
      queryClient.setQueryData<Item[]>(itemKeys.list(), items =>
        items?.map(item => (item.id === id ? { ...item, ...updates } : item)),
      );
      return { previous };
    },
    onError: (_error, { id }, context) => {
      // 목록 전체가 아니라 실패한 품목만 되돌려서, 동시에 진행 중인 다른 변경은 그대로 둔다
      const previous = context?.previous;
      if (!previous) return;
      queryClient.setQueryData<Item[]>(itemKeys.list(), items =>
        items?.map(item => (item.id === id ? previous : item)),
      );
    },
    onSettled: () => {
      // 다른 변경이 진행 중이면 그 변경의 낙관적 값이 덮이지 않도록 마지막 것만 다시 불러온다
      if (queryClient.isMutating({ mutationKey: UPDATE_MUTATION_KEY }) === 1) {
        return invalidateList(queryClient);
      }
    },
  });
}

export function useFinishItem() {
  const { mutate, ...rest } = useUpdateItem();
  return {
    ...rest,
    finishItem: (id: string) => mutate({ id, updates: { finished: true } }),
  };
}

function invalidateList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: itemKeys.list() });
}
