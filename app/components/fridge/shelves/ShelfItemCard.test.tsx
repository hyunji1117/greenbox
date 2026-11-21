// app/components/fridge/shelves/ShelfItemCard.test.tsx

import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  track: vi.fn(),
}));
vi.mock('@/app/lib/items/useItems', () => ({
  useUpdateItem: () => ({ mutateAsync: mocks.mutateAsync, isError: false }),
}));
vi.mock('@/app/lib/fridges/useCurrentFridge', () => ({
  useCurrentFridge: () => ({ data: { myNotifyLevel: 'all' } }),
}));
vi.mock('@/app/lib/notifications/useNotifications', () => ({
  useToggleWatch: () => ({ mutate: vi.fn() }),
}));
vi.mock('@/app/lib/analytics/gtag', () => ({ track: mocks.track }));

import ShelfItemCard from './ShelfItemCard';

const tofu = {
  id: '5',
  name: '두부',
  category: 'fridge' as const,
  quantity: 1,
  eatenQuantity: 0,
  addedBy: { id: '7', name: '현지', isMember: true },
  addedAt: new Date(),
  comments: [],
  finished: false,
  expiryDate: '2026-11-20',
  watched: false,
  shelf: null,
  updatedAt: null,
  unit: null,
};

const renderCard = () =>
  render(
    <ShelfItemCard
      item={tofu}
      shelfCount={3}
      onFinish={() => {}}
      onEatSome={() => {}}
      onOpenDetail={() => {}}
    />,
  );

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('ShelfItemCard 선반 정하기', () => {
  it('고른 뒤 줄이 화면에서 사라져도 저장이 끝나면 item_shelf_set을 한 번 보낸다', async () => {
    let finishSave: () => void = () => {};
    mocks.mutateAsync.mockReturnValue(
      new Promise<void>(resolve => {
        finishSave = resolve;
      }),
    );
    const { unmount } = renderCard();
    fireEvent.click(
      screen.getByRole('button', { name: '두부 2번 선반에 두기' }),
    );
    expect(mocks.mutateAsync).toHaveBeenCalledWith({
      id: '5',
      updates: { shelf: 2 },
    });

    // 선반이 정해져 "선반 미정" 목록에서 빠지면 이 줄은 화면에서 사라진다
    unmount();
    await act(async () => finishSave());

    expect(mocks.track).toHaveBeenCalledTimes(1);
    expect(mocks.track).toHaveBeenCalledWith('item_shelf_set', {
      category: 'fridge',
      from: 'unassigned',
      to: 2,
    });
  });

  it('저장에 실패하면 이벤트를 보내지 않는다', async () => {
    mocks.mutateAsync.mockRejectedValue(new Error('fail'));
    renderCard();
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: '두부 1번 선반에 두기' }),
      );
    });
    expect(mocks.track).not.toHaveBeenCalled();
  });
});

describe('ShelfItemCard 앱이 추천 자리에 넣어 둔 식재료', () => {
  const placed = { ...tofu, shelf: 2, autoPlaced: true };

  it('여기 둘게요면 그 자리로 확정하고, 옮기기면 상세(냉장고 지도)를 연다', async () => {
    mocks.mutateAsync.mockResolvedValue({});
    const onOpenDetail = vi.fn();
    render(
      <ShelfItemCard
        item={placed}
        shelfCount={3}
        onFinish={() => {}}
        onEatSome={() => {}}
        onOpenDetail={onOpenDetail}
      />,
    );
    expect(screen.getByText('추천 자리에 넣었어요')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '두부 여기 둘게요' }));
    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        id: '5',
        updates: { shelf: 2 },
      }),
    );
    await waitFor(() =>
      expect(mocks.track).toHaveBeenCalledWith('shelf_auto_checked', {
        result: 'kept',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: '두부 옮기기' }));
    expect(onOpenDetail).toHaveBeenCalled();
  });

  it('직접 놓은 식재료에는 나오지 않는다', () => {
    render(
      <ShelfItemCard
        item={{ ...tofu, shelf: 2, autoPlaced: false }}
        shelfCount={3}
        onFinish={() => {}}
        onEatSome={() => {}}
        onOpenDetail={() => {}}
      />,
    );
    expect(screen.queryByText('추천 자리에 넣었어요')).toBeNull();
  });
});
