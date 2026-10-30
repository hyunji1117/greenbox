// app/lib/items/useItems.test.tsx

import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { itemKeys } from '@/app/lib/query/keys';
import type { Item } from '@/app/lib/schemas/item';
import {
  useCreateItem,
  useFinishItem,
  useItems,
  useUpdateItem,
} from './useItems';

const itemJson = (id: string, overrides = {}) => ({
  id,
  name: `품목${id}`,
  category: 'fridge',
  quantity: 1,
  addedBy: 'mom',
  addedAt: '2026-10-30T03:00:00.000Z',
  comments: [],
  finished: false,
  expiryDate: null,
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
  queryClient
    .getQueryData<Item[]>(itemKeys.list())
    ?.find(item => item.id === id);

function seedCache() {
  queryClient.setQueryData<Item[]>(itemKeys.list(), [
    { ...itemJson('1'), addedAt: new Date(), expiryDate: undefined } as Item,
    { ...itemJson('2'), addedAt: new Date(), expiryDate: undefined } as Item,
  ]);
}

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
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
});

describe('useCreateItem', () => {
  it('등록에 성공하면 목록을 다시 불러온다', async () => {
    seedCache();
    fetchMock.mockImplementation(async () => jsonResponse(itemJson('3'), 201));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useCreateItem(), { wrapper });

    await act(() =>
      result.current.mutateAsync({
        name: '우유',
        category: 'fridge',
        quantity: 1,
        addedBy: 'mom',
      }),
    );

    expect(invalidate).toHaveBeenCalledWith({ queryKey: itemKeys.list() });
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
