// app/lib/items/useItems.ts
// 냉장고 품목 서버 상태 훅. 화면은 fetch와 캐시를 몰라도 이 훅만 쓰면 된다.
// 모든 훅은 지금 보고 있는 냉장고(useCurrentFridge) 기준으로 불러오고 저장한다.

'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { apiFetch } from '@/app/lib/api/apiFetch';
import { track, type ItemAddSource } from '@/app/lib/analytics/gtag';
import { useCurrentFridge } from '@/app/lib/fridges/useCurrentFridge';
import { itemKeys } from '@/app/lib/query/keys';
import {
  CommentSchema,
  ItemListSchema,
  ItemSchema,
  type Comment,
  type CreateCommentInput,
  type CreateItemInput,
  type Item,
  type UpdateCommentInput,
  type UpdateItemInput,
} from '@/app/lib/schemas/item';

const ITEMS_URL = '/api/items';
const ITEMS_SHARED_REFRESH_MS = 15_000;
const UPDATE_MUTATION_KEY = [...itemKeys.all, 'update'] as const;

function useCurrentFridgeId(): string | undefined {
  return useCurrentFridge().data?.id;
}

// 냉장고를 아직 모르면 저장할 곳이 없으므로 요청을 보내지 않고 실패로 처리한다
function requireFridgeId(fridgeId: string | undefined): string {
  if (!fridgeId) throw new Error('냉장고를 불러오기 전에는 저장할 수 없습니다');
  return fridgeId;
}

export function useItems() {
  const fridge = useCurrentFridge();
  const fridgeId = fridge.data?.id;
  const items = useQuery({
    queryKey: itemKeys.list(fridgeId ?? ''),
    // signal을 넘기면 dev StrictMode의 재마운트가 첫 요청을 취소해 요청이 2번 나간다
    queryFn: () =>
      apiFetch(
        `${ITEMS_URL}?fridgeId=${encodeURIComponent(requireFridgeId(fridgeId))}`,
        ItemListSchema,
      ),
    enabled: Boolean(fridgeId),
    // 함께 쓰는 냉장고는 다른 가족이 넣거나 고친 품목이 새로고침 없이 보이도록 다시 확인한다
    refetchInterval:
      (fridge.data?.members.length ?? 1) > 1 ? ITEMS_SHARED_REFRESH_MS : false,
  });
  // 냉장고 조회가 실패하면 품목 조회는 시작되지 않으므로 그 실패를 화면에 그대로 알린다
  if (fridge.error) {
    return { ...items, error: fridge.error, refetch: fridge.refetch };
  }
  return items;
}

// source: 어느 화면에서 추가했는지 사용 기록에 남긴다
export function useCreateItem(source: ItemAddSource) {
  const queryClient = useQueryClient();
  const fridgeId = useCurrentFridgeId();
  return useMutation({
    mutationFn: (input: CreateItemInput) =>
      apiFetch(ITEMS_URL, ItemSchema, {
        method: 'POST',
        body: { ...input, fridgeId: requireFridgeId(fridgeId) },
      }),
    onSuccess: () => {
      track('item_added', { source, count: 1 });
      return invalidateList(queryClient, fridgeId);
    },
  });
}

// 여러 품목을 한 번에 냉장고에 넣는다. 장보기 완료와 사진으로 찾은 품목 넣기에서 쓴다
// 일부만 실패할 수 있어 품목별 성공 여부를 돌려준다
export function useAddPurchasedItems(
  source: Extract<ItemAddSource, 'purchase' | 'photo'> = 'purchase',
) {
  const queryClient = useQueryClient();
  const fridgeId = useCurrentFridgeId();
  return useMutation({
    mutationFn: async (inputs: CreateItemInput[]) => {
      const target = requireFridgeId(fridgeId);
      const results = await Promise.allSettled(
        inputs.map(input =>
          apiFetch(ITEMS_URL, ItemSchema, {
            method: 'POST',
            body: { ...input, fridgeId: target },
          }),
        ),
      );
      return results.map(result => result.status === 'fulfilled');
    },
    onSuccess: saved => {
      const count = saved.filter(Boolean).length;
      if (count > 0) track('item_added', { source, count });
      return invalidateList(queryClient, fridgeId);
    },
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
  const fridgeId = useCurrentFridgeId();
  const listKey = itemKeys.list(fridgeId ?? '');
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
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient
        .getQueryData<Item[]>(listKey)
        ?.find(item => item.id === id);
      queryClient.setQueryData<Item[]>(listKey, items =>
        items?.map(item => (item.id === id ? { ...item, ...updates } : item)),
      );
      return { previous };
    },
    onError: (_error, { id }, context) => {
      // 목록 전체가 아니라 실패한 품목만 되돌려서, 동시에 진행 중인 다른 변경은 그대로 둔다
      const previous = context?.previous;
      if (!previous) return;
      queryClient.setQueryData<Item[]>(listKey, items =>
        items?.map(item => (item.id === id ? previous : item)),
      );
    },
    onSettled: () => {
      // 다른 변경이 진행 중이면 그 변경의 낙관적 값이 덮이지 않도록 마지막 것만 다시 불러온다
      if (queryClient.isMutating({ mutationKey: UPDATE_MUTATION_KEY }) === 1) {
        return invalidateList(queryClient, fridgeId);
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

// 서버에 저장되기 전 화면에 먼저 그린 댓글의 id 앞머리
const PENDING_COMMENT_PREFIX = 'pending-';
export const isPendingComment = (comment: Comment) =>
  comment.id.startsWith(PENDING_COMMENT_PREFIX);

// 한 품목의 댓글 목록만 바꾼다
function updateComments(
  queryClient: QueryClient,
  listKey: readonly unknown[],
  itemId: string,
  change: (comments: Comment[]) => Comment[],
) {
  queryClient.setQueryData<Item[]>(listKey, items =>
    items?.map(item =>
      item.id === itemId ? { ...item, comments: change(item.comments) } : item,
    ),
  );
}

// 보내자마자 댓글을 목록에 먼저 그리고, 서버가 만든 댓글이 오면 바꿔 끼운다
// 실패하면 먼저 그린 댓글을 지운다 (입력한 내용은 화면이 지우지 않고 남겨 둔다)
// 목록 전체를 다시 불러오지 않아 다른 변경의 낙관적 값을 건드리지 않는다
export function useAddComment() {
  const queryClient = useQueryClient();
  const fridge = useCurrentFridge().data;
  const listKey = itemKeys.list(fridge?.id ?? '');
  return useMutation({
    mutationFn: ({ itemId, input }: AddCommentVariables) =>
      apiFetch(`${ITEMS_URL}/${itemId}/comments`, CommentSchema, {
        method: 'POST',
        body: input,
      }),
    onMutate: ({ itemId, input }) => {
      const me = fridge?.members.find(m => m.userId === fridge.myUserId);
      const pending: Comment = {
        id: `${PENDING_COMMENT_PREFIX}${Date.now()}`,
        text: input.text.trim(),
        author: {
          id: fridge?.myUserId ?? null,
          name: me?.name ?? null,
          isMember: true,
        },
        createdAt: new Date(),
        editedAt: null,
      };
      updateComments(queryClient, listKey, itemId, comments => [
        ...comments,
        pending,
      ]);
      return { pendingId: pending.id };
    },
    onSuccess: (comment, { itemId }, context) => {
      track('comment_added');
      // 그사이 목록을 다시 불러와 먼저 그린 댓글이 사라졌어도 저장된 댓글은 보이게 한다
      updateComments(queryClient, listKey, itemId, comments => [
        ...comments.filter(
          c => c.id !== context?.pendingId && c.id !== comment.id,
        ),
        comment,
      ]);
    },
    onError: (_error, { itemId }, context) => {
      updateComments(queryClient, listKey, itemId, comments =>
        comments.filter(c => c.id !== context?.pendingId),
      );
    },
  });
}

export interface EditCommentVariables {
  itemId: string;
  commentId: string;
  input: UpdateCommentInput;
}

// 내가 쓴 댓글의 내용을 고친다. 바로 반영하고, 실패하면 원래 내용으로 되돌린다
export function useEditComment() {
  const queryClient = useQueryClient();
  const fridgeId = useCurrentFridgeId();
  const listKey = itemKeys.list(fridgeId ?? '');
  return useMutation({
    mutationFn: ({ itemId, commentId, input }: EditCommentVariables) =>
      apiFetch(`${ITEMS_URL}/${itemId}/comments/${commentId}`, CommentSchema, {
        method: 'PATCH',
        body: input,
      }),
    onMutate: ({ itemId, commentId, input }) => {
      const previous = queryClient
        .getQueryData<Item[]>(listKey)
        ?.find(item => item.id === itemId)
        ?.comments.find(c => c.id === commentId);
      updateComments(queryClient, listKey, itemId, comments =>
        comments.map(c =>
          c.id === commentId
            ? { ...c, text: input.text.trim(), editedAt: new Date() }
            : c,
        ),
      );
      return { previous };
    },
    onSuccess: (comment, { itemId }) => {
      track('comment_edited');
      updateComments(queryClient, listKey, itemId, comments =>
        comments.map(c => (c.id === comment.id ? comment : c)),
      );
    },
    onError: (_error, { itemId, commentId }, context) => {
      const previous = context?.previous;
      if (!previous) return;
      updateComments(queryClient, listKey, itemId, comments =>
        comments.map(c => (c.id === commentId ? previous : c)),
      );
    },
  });
}

function invalidateList(queryClient: QueryClient, fridgeId?: string) {
  if (!fridgeId) return;
  return queryClient.invalidateQueries({ queryKey: itemKeys.list(fridgeId) });
}
