// app/components/fridge/FridgeItem.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock('@/app/lib/items/useItems', () => ({
  useUpdateItem: () => ({ mutate: mocks.mutate, isError: false }),
}));
vi.mock('@/app/lib/fridges/useCurrentFridge', () => ({
  useCurrentFridge: () => ({ data: { myNotifyLevel: 'all' } }),
}));
vi.mock('@/app/lib/notifications/useNotifications', () => ({
  useToggleWatch: () => ({ mutate: vi.fn() }),
}));
vi.mock('@/app/components/fridge/ItemComments', () => ({
  default: () => null,
}));

import FridgeItem from './FridgeItem';

const eggs = (overrides = {}) => ({
  id: '1',
  name: '계란',
  category: 'fridge' as const,
  quantity: 30,
  eatenQuantity: 0,
  addedBy: { id: '7', name: '현지', isMember: true },
  addedAt: new Date(),
  comments: [],
  finished: false,
  expiryDate: '2026-11-20',
  watched: false,
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe('FridgeItem', () => {
  it('여러 개 남은 품목은 다 먹음을 누르면 먹은 개수를 고르고, 처음 산 수량은 그대로 둔다', () => {
    const onFinish = vi.fn();
    const onEatSome = vi.fn();
    render(
      <FridgeItem item={eggs()} onFinish={onFinish} onEatSome={onEatSome} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /다 먹음/ }));
    const count = screen.getByRole('textbox', { name: '계란 먹은 개수' });
    fireEvent.change(count, { target: { value: '6' } });
    fireEvent.blur(count);
    fireEvent.click(screen.getByRole('button', { name: '6구 먹음' }));

    expect(onEatSome).toHaveBeenCalledWith(6);
    expect(onFinish).not.toHaveBeenCalled();
  });

  it('남은 만큼 고르면 모두 먹음으로 끝내고, 하나 남은 품목은 바로 끝낸다', () => {
    const onFinish = vi.fn();
    const { rerender } = render(
      <FridgeItem
        item={eggs({ quantity: 3, eatenQuantity: 1 })}
        onFinish={onFinish}
        onEatSome={vi.fn()}
      />,
    );
    expect(screen.getByText('1구 먹고 2구 남았어요')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /다 먹음/ }));
    fireEvent.click(
      screen.getByRole('button', { name: '계란 먹은 개수 늘리기' }),
    );
    fireEvent.click(screen.getByRole('button', { name: '모두 먹음' }));
    expect(onFinish).toHaveBeenCalledWith('eaten');

    rerender(
      <FridgeItem
        item={eggs({ quantity: 1 })}
        onFinish={onFinish}
        onEatSome={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /다 먹음/ }));
    expect(onFinish).toHaveBeenCalledTimes(2);
  });

  it('수량을 눌러 직접 적으면 그 값으로 저장한다', () => {
    render(
      <FridgeItem
        item={eggs({ quantity: 1 })}
        onFinish={vi.fn()}
        onEatSome={vi.fn()}
      />,
    );
    const quantity = screen.getByRole('textbox', { name: '계란 수량' });
    fireEvent.change(quantity, { target: { value: '30' } });
    fireEvent.blur(quantity);
    expect(mocks.mutate).toHaveBeenCalledWith(
      { id: '1', updates: { quantity: 30 } },
      expect.anything(),
    );
  });
});
