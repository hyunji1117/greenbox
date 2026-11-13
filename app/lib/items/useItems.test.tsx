// app/lib/items/useItems.test.tsx

import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fridgeKeys, itemKeys } from '@/app/lib/query/keys';
import type { Item } from '@/app/lib/schemas/item';
import {
  useAddComment,
  useAddPurchasedItems,
  useEditComment,
  useCreateItem,
  useFinishItem,
  useItems,
  useUpdateItem,
} from './useItems';

const FRIDGE_ID = '5';
const me = { id: '7', name: '현지', isMember: true };
const LIST_KEY = itemKeys.list(FRIDGE_ID);

const itemJson = (id: string, overrides = {}) => ({
  id,
  name: `품목${id}`,
  category: 'fridge',
  quantity: 1,
  eatenQuantity: 0,
  addedBy: me,
  addedAt: '2026-10-30T03:00:00.000Z',
  comments: [],
  finished: false,
  expiryDate: null,
  watched: false,
  shelf: null,
  updatedAt: null,
  ...overrides,
});

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

// 원하는 시점에 응답을 돌려주도록 fetch를 멈춰 둔다
function deferredResponse() {
  let resolve!: (res: Response) => void;
  const promise = new Promise<Response>(r => (resolve = r));
  return { promise, resolve };
}

const fetchMock = vi.fn();
let queryClient: QueryClient;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const cachedItem = (id: string) =>
  queryClient.getQueryData<Item[]>(LIST_KEY)?.find(item => item.id === id);

function seedCache() {
  queryClient.setQueryData<Item[]>(LIST_KEY, [
    { ...itemJson('1'), addedAt: new Date(), expiryDate: undefined } as Item,
    { ...itemJson('2'), addedAt: new Date(), expiryDate: undefined } as Item,
  ]);
}

beforeEach(() => {
  queryClient = new QueryClient({
    // 미리 넣어 둔 냉장고 정보를 다시 요청하지 않도록 캐시를 오래 둔다
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
  queryClient.setQueryData(fridgeKeys.current(), {
    id: FRIDGE_ID,
    name: '내 냉장고',
    role: 'owner',
    myUserId: '7',
    members: [{ userId: '7', name: '현지', image: null, role: 'owner' }],
  });
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('useItems', () => {
  it('여러 컴포넌트가 동시에 써도 요청은 1번만 보낸다', async () => {
    fetchMock.mockImplementation(async () => jsonResponse([itemJson('1')]));

    const first = renderHook(() => useItems(), { wrapper });
    const second = renderHook(() => useItems(), { wrapper });

    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    expect(second.result.current.data?.[0].addedAt).toBeInstanceOf(Date);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('지금 보고 있는 냉장고 번호로 목록을 요청한다', async () => {
    fetchMock.mockImplementation(async () => jsonResponse([]));

    const { result } = renderHook(() => useItems(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchMock.mock.calls[0][0]).toBe('/api/items?fridgeId=5');
  });

  it('냉장고를 불러오지 못하면 품목을 요청하지 않고 실패를 알린다', async () => {
    queryClient.removeQueries({ queryKey: fridgeKeys.current() });
    fetchMock.mockImplementation(async () =>
      jsonResponse({ error: 'server' }, 500),
    );

    const { result } = renderHook(() => useItems(), { wrapper });

    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/fridges/current');
  });
});

describe('useCreateItem', () => {
  it('등록에 성공하면 목록을 다시 불러온다', async () => {
    seedCache();
    fetchMock.mockImplementation(async () => jsonResponse(itemJson('3'), 201));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateItem('fridge_quick_add'), {
      wrapper,
    });

    await act(() =>
      result.current.mutateAsync({
        name: '우유',
        category: 'fridge',
        quantity: 1,
      }),
    );

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      name: '우유',
      category: 'fridge',
      quantity: 1,
      fridgeId: FRIDGE_ID,
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: LIST_KEY });
  });
});

describe('useFinishItem 낙관적 업데이트', () => {
  it('서버 응답 전에 화면 캐시부터 바꾼다', async () => {
    seedCache();
    const pending = deferredResponse();
    fetchMock.mockReturnValue(pending.promise);
    const { result } = renderHook(() => useFinishItem(), { wrapper });

    act(() => result.current.finishItem('1'));

    await waitFor(() => expect(cachedItem('1')?.finished).toBe(true));
    expect(cachedItem('2')?.finished).toBe(false);

    pending.resolve(jsonResponse(itemJson('1', { finished: true })));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('서버가 실패하면 원래 값으로 되돌린다', async () => {
    seedCache();
    fetchMock.mockImplementation(async () =>
      jsonResponse({ error: 'not_found' }, 404),
    );
    const { result } = renderHook(() => useFinishItem(), { wrapper });

    act(() => result.current.finishItem('1'));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(cachedItem('1')?.finished).toBe(false);
  });

  it('한 품목이 실패해도 진행 중인 다른 품목의 변경은 유지한다', async () => {
    seedCache();
    const first = deferredResponse();
    const second = deferredResponse();
    fetchMock
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const hookA = renderHook(() => useUpdateItem(), { wrapper });
    const hookB = renderHook(() => useUpdateItem(), { wrapper });

    act(() =>
      hookA.result.current.mutate({ id: '1', updates: { quantity: 5 } }),
    );
    act(() =>
      hookB.result.current.mutate({ id: '2', updates: { quantity: 7 } }),
    );
    await waitFor(() => expect(cachedItem('2')?.quantity).toBe(7));

    first.resolve(jsonResponse({ error: 'server' }, 500));
    await waitFor(() => expect(hookA.result.current.isError).toBe(true));

    expect(cachedItem('1')?.quantity).toBe(1);
    expect(cachedItem('2')?.quantity).toBe(7);
    expect(invalidate).not.toHaveBeenCalled();

    second.resolve(jsonResponse(itemJson('2', { quantity: 7 })));
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(1));
  });
});

describe('같은 품목의 연속 변경', () => {
  it('앞 요청이 끝난 뒤에 다음 요청을 보낸다', async () => {
    seedCache();
    const first = deferredResponse();
    fetchMock
      .mockReturnValueOnce(first.promise)
      .mockImplementation(async () =>
        jsonResponse(itemJson('1', { quantity: 3 })),
      );
    const { result } = renderHook(() => useUpdateItem('1'), { wrapper });

    act(() => result.current.mutate({ id: '1', updates: { quantity: 2 } }));
    act(() => result.current.mutate({ id: '1', updates: { quantity: 3 } }));

    await waitFor(() => expect(cachedItem('1')?.quantity).toBe(3));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    first.resolve(jsonResponse(itemJson('1', { quantity: 2 })));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});

const commentJson = (overrides = {}) => ({
  id: '9',
  text: '맛있다',
  author: me,
  createdAt: '2026-10-30T05:00:00.000Z',
  editedAt: null,
  ...overrides,
});

describe('useAddComment', () => {
  it('보내자마자 댓글을 그리고, 저장되면 서버가 만든 댓글로 바꾼다', async () => {
    seedCache();
    const response = deferredResponse();
    fetchMock.mockReturnValue(response.promise);
    const { result } = renderHook(() => useAddComment(), { wrapper });

    act(() => {
      result.current.mutate({ itemId: '1', input: { text: ' 맛있다 ' } });
    });

    await waitFor(() => expect(cachedItem('1')?.comments).toHaveLength(1));
    expect(cachedItem('1')?.comments[0]).toMatchObject({
      text: '맛있다',
      author: me,
    });
    expect(cachedItem('2')?.comments).toHaveLength(0);

    response.resolve(jsonResponse(commentJson(), 201));

    await waitFor(() => expect(cachedItem('1')?.comments[0].id).toBe('9'));
    expect(cachedItem('1')?.comments).toHaveLength(1);
    expect(cachedItem('1')?.comments[0].createdAt).toBeInstanceOf(Date);
  });

  it('저장에 실패하면 먼저 그린 댓글을 지운다', async () => {
    seedCache();
    fetchMock.mockResolvedValue(jsonResponse({ error: 'server' }, 500));
    const { result } = renderHook(() => useAddComment(), { wrapper });

    await act(() =>
      result.current
        .mutateAsync({ itemId: '1', input: { text: '맛있다' } })
        .catch(() => null),
    );

    expect(cachedItem('1')?.comments).toHaveLength(0);
  });

  it('그사이 목록을 다시 불러와 먼저 그린 댓글이 사라져도 저장된 댓글은 남는다', async () => {
    seedCache();
    const response = deferredResponse();
    fetchMock.mockReturnValue(response.promise);
    const { result } = renderHook(() => useAddComment(), { wrapper });

    act(() => {
      result.current.mutate({ itemId: '1', input: { text: '맛있다' } });
    });
    await waitFor(() => expect(cachedItem('1')?.comments).toHaveLength(1));
    seedCache();
    response.resolve(jsonResponse(commentJson(), 201));

    await waitFor(() => expect(cachedItem('1')?.comments[0]?.id).toBe('9'));
    expect(cachedItem('1')?.comments).toHaveLength(1);
  });
});

describe('useEditComment', () => {
  function seedWithComment() {
    seedCache();
    queryClient.setQueryData<Item[]>(LIST_KEY, items =>
      items?.map(item =>
        item.id === '1'
          ? {
              ...item,
              comments: [
                {
                  ...commentJson(),
                  createdAt: new Date('2026-10-30T05:00:00.000Z'),
                  editedAt: null,
                },
              ],
            }
          : item,
      ),
    );
  }

  it('고친 내용을 바로 보여 주고, 서버가 돌려준 고친 시각으로 맞춘다', async () => {
    seedWithComment();
    const response = deferredResponse();
    fetchMock.mockReturnValue(response.promise);
    const { result } = renderHook(() => useEditComment(), { wrapper });

    act(() => {
      result.current.mutate({
        itemId: '1',
        commentId: '9',
        input: { text: '아주 맛있다' },
      });
    });

    await waitFor(() =>
      expect(cachedItem('1')?.comments[0].text).toBe('아주 맛있다'),
    );
    expect(fetchMock.mock.calls[0][0]).toBe('/api/items/1/comments/9');

    response.resolve(
      jsonResponse(
        commentJson({
          text: '아주 맛있다',
          editedAt: '2026-10-30T06:00:00.000Z',
        }),
      ),
    );

    await waitFor(() =>
      expect(cachedItem('1')?.comments[0].editedAt).toEqual(
        new Date('2026-10-30T06:00:00.000Z'),
      ),
    );
  });

  it('실패하면 원래 내용으로 되돌린다', async () => {
    seedWithComment();
    fetchMock.mockResolvedValue(jsonResponse({ error: 'not_found' }, 404));
    const { result } = renderHook(() => useEditComment(), { wrapper });

    await act(() =>
      result.current
        .mutateAsync({ itemId: '1', commentId: '9', input: { text: '고침' } })
        .catch(() => null),
    );

    expect(cachedItem('1')?.comments[0]).toMatchObject({
      text: '맛있다',
      editedAt: null,
    });
  });
});

describe('useAddPurchasedItems', () => {
  it('일부가 실패하면 품목별 결과를 돌려주고 목록은 1번만 다시 불러온다', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(itemJson('3'), 201))
      .mockResolvedValueOnce(jsonResponse({ error: 'server' }, 500));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useAddPurchasedItems(), { wrapper });
    const input = {
      category: 'fridge' as const,
      quantity: 1,
    };

    const saved = await act(() =>
      result.current.mutateAsync([
        { ...input, name: '우유' },
        { ...input, name: '계란' },
      ]),
    );

    expect(saved).toEqual([true, false]);
    expect(invalidate).toHaveBeenCalledTimes(1);
  });
});
