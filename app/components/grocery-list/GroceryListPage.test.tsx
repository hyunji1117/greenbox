// app/components/grocery-list/GroceryListPage.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import shoppingListStorage from '@/app/lib/storage/ShoppingListStorage';
import GroceryListPage from './GroceryListPage';

vi.mock('@/app/lib/items/useItems', () => ({
  useAddPurchasedItems: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
// 사진으로 담기 화면은 PhotoAddSheet.test.tsx에서 따로 확인한다
vi.mock('@/app/components/fridge/PhotoAddSheet', () => ({ default: () => null }));
vi.mock('@/app/lib/storage/PurchaseDataStorage', () => ({
  default: {
    recordPurchase: vi.fn(),
    getAllPurchaseHistory: vi.fn().mockResolvedValue([]),
  },
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

  it('이름을 적고 담으면 리스트에 넣고 입력을 비운다', () => {
    render(<GroceryListPage />);

    add(' 우유 ');

    expect(
      screen.getByRole('button', { name: '우유 수량 늘리기' }),
    ).toBeTruthy();
    expect(input()).toHaveProperty('value', '');
  });

  it('전체 지우기를 되돌릴 수 있다', () => {
    render(<GroceryListPage />);
    add('김치');

    fireEvent.click(screen.getByRole('button', { name: '전체 지우기' }));
    expect(screen.queryByRole('button', { name: '김치 지우기' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '되돌리기' }));
    expect(screen.getByRole('button', { name: '김치 지우기' })).toBeTruthy();
  });

  it('사진을 누르면 리스트에 담고 체크로 보여 주며, 다시 누르면 빼고, 수량은 리스트에서 바꾼다', () => {
    render(<GroceryListPage />);
    fireEvent.click(
      screen.getByRole('button', { name: '시금치 리스트에 담기' }),
    );

    const picked = screen.getByRole('button', {
      name: '시금치 담음, 누르면 리스트에서 빼기',
    });
    expect(picked.getAttribute('aria-pressed')).toBe('true');

    // 계란 30개처럼 많이 살 때는 리스트의 수량 칸에 직접 적는다
    const quantity = screen.getByRole('textbox', { name: '시금치 수량' });
    fireEvent.change(quantity, { target: { value: '30' } });
    fireEvent.blur(quantity);
    expect(
      (screen.getByRole('textbox', { name: '시금치 수량' }) as HTMLInputElement)
        .value,
    ).toBe('30');

    fireEvent.click(picked);
    expect(
      screen.getByRole('button', { name: '시금치 리스트에 담기' }),
    ).toBeTruthy();
    expect(screen.queryByRole('textbox', { name: '시금치 수량' })).toBeNull();
  });

  it('사진 목록에 없는 이름도 찾은 그대로 담는다', () => {
    render(<GroceryListPage />);

    fireEvent.change(input(), { target: { value: '김치' } });
    fireEvent.click(screen.getByRole('button', { name: '‘김치’ 그대로 담기' }));

    expect(
      screen.getByRole('button', { name: '김치 수량 늘리기' }),
    ).toBeTruthy();
    expect(input()).toHaveProperty('value', '');
  });

  it('찾는 동안에는 종류와 상관없이 이름이 맞는 사진만 보여 준다', () => {
    render(<GroceryListPage />);

    fireEvent.change(input(), { target: { value: '치즈' } });

    expect(
      screen.getByRole('button', { name: '브리 치즈 리스트에 담기' }),
    ).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: '시금치 리스트에 담기' }),
    ).toBeNull();
  });
});
