// app/lib/items/useFinishWithUndo.test.tsx

import React from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fridgeKeys, itemKeys } from '@/app/lib/query/keys';
import type { Item } from '@/app/lib/schemas/item';
import { UNDO_WINDOW_MS, useFinishWithUndo } from './useFinishWithUndo';

const itemJson = (finished: boolean, eatenQuantity = 0) => ({
  id: '1',
  name: '당근',
  category: 'fridge',
  quantity: 1,
  eatenQuantity,
  addedBy: { id: '7', name: '현지', isMember: true },
  addedAt: '2026-10-30T03:00:00.000Z',
  comments: [],
  finished,
  expiryDate: null,
});
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

const fetchMock = vi.fn();
let queryClient: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
const cached = () => queryClient.getQueryData<Item[]>(itemKeys.list('5'))?.[0];
const item = { id: '1', name: '당근', quantity: 1, eatenQuantity: 0 };

describe('useFinishWithUndo', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { staleTime: Infinity },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData(fridgeKeys.current(), {
      id: '5',
      name: '내 냉장고',
      role: 'owner',
      members: [],
    });
    queryClient.setQueryData(itemKeys.list('5'), [
      { ...itemJson(false), addedAt: new Date(), expiryDate: undefined },
    ]);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('소진 후 되돌리기 안내를 보여주고 정해진 시간 뒤 닫는다', async () => {
    fetchMock.mockImplementation(async () => json(itemJson(true)));
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { result } = renderHook(() => useFinishWithUndo(), { wrapper });

    act(() => result.current.finish(item, 'eaten'));

    expect(result.current.isNoticeVisible).toBe(true);
    expect(result.current.notice).toEqual({
      subject: '당근',
      message: '다 먹었어요',
      canUndo: true,
    });
    await waitFor(() => expect(cached()?.finished).toBe(true));

    act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS));
    expect(result.current.isNoticeVisible).toBe(false);
  });

  it('되돌리기는 소진 요청이 끝난 뒤에 보낸다', async () => {
    let resolveFinish: (response: Response) => void = () => {};
    fetchMock
      .mockReturnValueOnce(new Promise(r => (resolveFinish = r)))
      .mockImplementation(async () => json(itemJson(false)));
    const { result } = renderHook(() => useFinishWithUndo(), { wrapper });

    act(() => result.current.finish(item, 'discarded'));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await act(async () => {
      void result.current.undo();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => resolveFinish(json(itemJson(true))));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [, init] = fetchMock.mock.calls[1];
    expect(JSON.parse(init.body)).toEqual({
      finished: false,
      eatenQuantity: 0,
    });
    await waitFor(() => expect(cached()?.finished).toBe(false));
    expect(result.current.isNoticeVisible).toBe(false);
  });

  it('일부만 먹으면 처음 산 수량은 두고 먹은 개수만 늘리며, 되돌리면 원래 개수로 돌린다', async () => {
    fetchMock.mockImplementation(async () => json(itemJson(false, 2)));
    const { result } = renderHook(() => useFinishWithUndo(), { wrapper });
    const eggs = { id: '1', name: '계란', eatenQuantity: 0 };

    act(() => result.current.eatSome(eggs, 2));
    expect(result.current.notice).toEqual({
      subject: '계란',
      message: '2개 먹었어요',
      canUndo: true,
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      eatenQuantity: 2,
    });

    await act(async () => {
      await result.current.undo();
    });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      eatenQuantity: 0,
    });
  });

  it('저장에 실패하면 카드를 되돌리고 실패를 알린다', async () => {
    fetchMock.mockImplementation(async () => json({ error: 'x' }, 404));
    const { result } = renderHook(() => useFinishWithUndo(), { wrapper });

    act(() => result.current.finish(item, 'eaten'));

    await waitFor(() =>
      expect(result.current.notice).toEqual({
        message: '저장하지 못했어요. 다시 눌러 주세요',
        canUndo: false,
      }),
    );
    expect(cached()?.finished).toBe(false);
  });
});
