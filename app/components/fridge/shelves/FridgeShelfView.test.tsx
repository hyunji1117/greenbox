// app/components/fridge/shelves/FridgeShelfView.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/lib/analytics/gtag', () => ({ track: vi.fn() }));

import FridgeShelfView from './FridgeShelfView';

const item = (id: string, shelf: number) => ({
  id,
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
  shelf,
  updatedAt: null,
});

const renderView = (onRemoveShelf = vi.fn()) => {
  render(
    <FridgeShelfView
      // 냉장실 선반 2개가 모두 차 있어 줄일 빈 선반이 없다
      items={[item('1', 1), item('2', 2)]}
      counts={{ fridge: 2, freezer: 2, pantry: 2 }}
      onOpenShelf={() => {}}
      onAddShelf={() => {}}
      onRemoveShelf={onRemoveShelf}
      isChanging={false}
      notice=""
      isOpen
      onOpenChange={() => {}}
    />,
  );
  return onRemoveShelf;
};

afterEach(cleanup);

describe('FridgeShelfView 선반 줄이기', () => {
  it('빈 선반이 없으면 눌러도 서버에 묻지 않고 줄일 수 없는 이유를 알려 준다', () => {
    const onRemoveShelf = renderView();
    // 냉동실, 냉장실, 상온 순서의 버튼 중 냉장실 버튼
    const buttons = screen.getAllByRole('button', { name: '선반 줄이기' });
    const fridgeButton = buttons[1];
    expect(fridgeButton.getAttribute('aria-disabled')).toBe('true');

    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    fireEvent.click(fridgeButton);
    expect(onRemoveShelf).not.toHaveBeenCalled();
    // 작은 화면에서 하단 메뉴에 가리지 않도록 안내가 보이는 곳까지 스크롤한다
    expect(scrollIntoView).toHaveBeenCalledWith(
      expect.objectContaining({ block: 'nearest' }),
    );
    expect(screen.getByRole('status').textContent).toContain(
      '식재료가 있는 선반은 줄일 수 없어요',
    );
  });

  it('빈 선반이 있으면 그대로 줄인다', () => {
    const onRemoveShelf = renderView();
    // 냉동실은 비어 있어 줄일 수 있다
    fireEvent.click(screen.getAllByRole('button', { name: '선반 줄이기' })[0]);
    expect(onRemoveShelf).toHaveBeenCalledWith('freezer');
  });
});
