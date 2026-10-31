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
  CommentSchema,
  ItemListSchema,
  ItemSchema,
  type CreateCommentInput,
  type CreateItemInput,
  type Item,
  type UpdateItemInput,
} from '@/app/lib/schemas/item';

const ITEMS_URL = '/api/items';
const UPDATE_MUTATION_KEY = [...itemKeys.all, 'update'] as const;

export function useItems() {
  return useQuery({
    queryKey: itemKeys.list(),
    // signal을 넘기면 dev StrictMode의 재마운트가 첫 요청을 취소해 요청이 2번 나간다
    queryFn: () => apiFetch(ITEMS_URL, ItemListSchema),
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

// 구매 완료한 품목을 한 번에 냉장고에 넣는다. 일부만 실패할 수 있어 품목별 성공 여부를 돌려준다
export function useAddPurchasedItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inputs: CreateItemInput[]) => {
      const results = await Promise.allSettled(
        inputs.map(input =>
          apiFetch(ITEMS_URL, ItemSchema, { method: 'POST', body: input }),
        ),
      );
      return results.map(result => result.status === 'fulfilled');
    },
    onSuccess: () => invalidateList(queryClient),
  });
}

export interface UpdateItemVariables {
  id: string;
  updates: UpdateItemInput;
}

// 수량 변경과 소진처럼 결과를 바로 예상할 수 있는 변경이라 낙관적으로 먼저 반영한다
// itemId를 넘기면 같은 품목의 요청을 순서대로 보내서, 늦게 도착한 요청이 최신 값을 덮어쓰지 않는다
export function useUpdateItem(itemId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: UPDATE_MUTATION_KEY,
    scope: itemId ? { id: `item-update-${itemId}` } : undefined,
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

export function useFinishItem(itemId?: string) {
  const { mutate, ...rest } = useUpdateItem(itemId);
  return {
    ...rest,
    finishItem: (id: string) => mutate({ id, updates: { finished: true } }),
  };
}

export interface AddCommentVariables {
  itemId: string;
  input: CreateCommentInput;
}

// 서버가 만든 댓글을 받아 캐시에 바로 넣는다. 재조회하지 않아 다른 변경의 낙관적 값을 건드리지 않는다
export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, input }: AddCommentVariables) =>
      apiFetch(`${ITEMS_URL}/${itemId}/comments`, CommentSchema, {
        method: 'POST',
        body: input,
      }),
    onSuccess: (comment, { itemId }) => {
      queryClient.setQueryData<Item[]>(itemKeys.list(), items =>
        items?.map(item =>
          item.id === itemId
            ? { ...item, comments: [...item.comments, comment] }
            : item,
        ),
      );
    },
  });
}

function invalidateList(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: itemKeys.list() });
}
