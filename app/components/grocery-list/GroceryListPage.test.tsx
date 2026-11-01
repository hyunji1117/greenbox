// app/components/grocery-list/GroceryListPage.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import shoppingListStorage from '@/app/lib/storage/ShoppingListStorage';
import GroceryListPage from './GroceryListPage';

vi.mock('@/app/context/FridgeContext', () => ({
  useFridge: () => ({ currentUser: 'mom' }),
}));
vi.mock('@/app/lib/items/useItems', () => ({
  useAddPurchasedItems: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('@/app/lib/storage/PurchaseDataStorage', () => ({
  default: { recordPurchase: vi.fn() },
}));

const input = () => screen.getByLabelText('살 식재료 이름');
const add = (name: string) => {
  fireEvent.change(input(), { target: { value: name } });
  fireEvent.submit(input());
};

describe('GroceryListPage', () => {
  beforeEach(() => {
    shoppingListStorage.clearAll();
  });
  afterEach(cleanup);

  it('이름을 적으면 리스트에 담고 입력을 비운다', () => {
    render(<GroceryListPage />);

    add(' 우유 ');

    expect(screen.getByText('우유')).toBeTruthy();
    expect(input()).toHaveProperty('value', '');
  });

  it('전체 지우기를 되돌릴 수 있다', () => {
    render(<GroceryListPage />);
    add('우유');

    fireEvent.click(screen.getByRole('button', { name: '전체 지우기' }));
    expect(screen.queryByText('우유')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '되돌리기' }));
    expect(screen.getByText('우유')).toBeTruthy();
  });
});
