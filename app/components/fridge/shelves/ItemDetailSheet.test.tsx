// app/components/fridge/shelves/ItemDetailSheet.test.tsx

import React from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ mutateAsync: vi.fn(), mutate: vi.fn() }));
vi.mock('@/app/lib/items/useItems', () => ({
  useUpdateItem: () => ({
    mutateAsync: mocks.mutateAsync,
    mutate: mocks.mutate,
    isPending: false,
  }),
}));
vi.mock('@/app/lib/analytics/gtag', () => ({ track: vi.fn() }));

import ItemDetailSheet from './ItemDetailSheet';

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
  expiryDate: '2026-11-30',
  watched: false,
  shelf: 4,
  updatedAt: null,
  unit: null,
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ItemDetailSheet 선반 옮기기', () => {
  it('선반을 누르면 바로 옮기지 않고, 지금 → 옮길 자리를 보여 준 뒤 버튼으로 옮긴다', async () => {
    mocks.mutateAsync.mockResolvedValue({});
    render(
      <ItemDetailSheet
        item={tofu}
        counts={{ fridge: 5, freezer: 3, pantry: 2 }}
        items={[tofu]}
        onClose={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('radio', { name: '2번 선반, 0개' }));
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    expect(
      screen.getByRole('radio', { name: '4번 선반, 지금 여기' }),
    ).toBeTruthy();

    // 지금 자리를 다시 누르면 고른 것이 지워진다
    fireEvent.click(screen.getByRole('radio', { name: '4번 선반, 지금 여기' }));
    expect(screen.queryByRole('button', { name: /번으로 옮기기/ })).toBeNull();

    fireEvent.click(screen.getByRole('radio', { name: '2번 선반, 0개' }));
    fireEvent.click(
      screen.getByRole('button', { name: '냉장실 4번 → 2번으로 옮기기' }),
    );
    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        id: '5',
        updates: { shelf: 2 },
      }),
    );
  });
});
