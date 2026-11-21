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
  unit: null,
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

describe('FridgeShelfView 문 밀기', () => {
  const renderDoors = (isOpen: boolean, onOpenShelf = vi.fn()) => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <FridgeShelfView
        items={[item('1', 1)]}
        counts={{ fridge: 2, freezer: 2, pantry: 2 }}
        onOpenShelf={onOpenShelf}
        onAddShelf={() => {}}
        onRemoveShelf={() => {}}
        isChanging={false}
        notice=""
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      />,
    );
    const doors = container.querySelector('.touch-pan-y') as HTMLElement;
    doors.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 360, height: 600 }) as DOMRect;
    return { doors, onOpenChange };
  };

  it('닫힌 문을 가운데에서 옆으로 밀면 열리고, 이어지는 클릭은 버튼 열기로 세지 않는다', () => {
    const { doors, onOpenChange } = renderDoors(false);
    fireEvent.pointerDown(doors, { clientX: 180, clientY: 300 });
    fireEvent.pointerUp(doors, { clientX: 260, clientY: 305 });
    fireEvent.click(screen.getByRole('button', { name: '눌러서 냉장고 열기' }));
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('열린 문은 끝에서 안쪽으로 밀면 닫히고, 그 손길로 선반이 열리지 않는다', () => {
    const onOpenShelf = vi.fn();
    const { doors, onOpenChange } = renderDoors(true, onOpenShelf);
    const shelf = screen.getByRole('button', { name: '냉동실 1번 선반, 0개' });
    fireEvent.pointerDown(doors, { clientX: 20, clientY: 200 });
    fireEvent.pointerUp(doors, { clientX: 110, clientY: 205 });
    fireEvent.click(shelf);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onOpenShelf).not.toHaveBeenCalled();
  });

  it('밀지 않고 누르면 선반이 그대로 열린다', () => {
    const onOpenShelf = vi.fn();
    const { doors, onOpenChange } = renderDoors(true, onOpenShelf);
    fireEvent.pointerDown(doors, { clientX: 20, clientY: 200 });
    fireEvent.pointerUp(doors, { clientX: 22, clientY: 201 });
    fireEvent.click(
      screen.getByRole('button', { name: '냉동실 1번 선반, 0개' }),
    );
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(onOpenShelf).toHaveBeenCalled();
  });

  it('열린 문은 오른쪽 절반에서 왼쪽으로 미는 중에 바로 닫히고, 이어서 손길이 끊겨도 한 번만 닫힌다', () => {
    const { doors, onOpenChange } = renderDoors(true);
    fireEvent.pointerDown(doors, { clientX: 200, clientY: 200 });
    fireEvent.pointerMove(doors, { clientX: 170, clientY: 202 });
    expect(onOpenChange).not.toHaveBeenCalled();
    fireEvent.pointerMove(doors, { clientX: 130, clientY: 204 });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    fireEvent.pointerCancel(doors);
    fireEvent.pointerUp(doors, { clientX: 100, clientY: 205 });
    expect(onOpenChange).toHaveBeenCalledTimes(1);
  });

  it('문이 열려 있으면 화면 끝에서 안쪽으로 미는 손길로 닫힌다 (냉장고 바깥에서 시작해도)', () => {
    const { onOpenChange } = renderDoors(true);
    const width = window.innerWidth;
    fireEvent.touchStart(window, {
      touches: [{ clientX: width - 5, clientY: 300 }],
    });
    fireEvent.touchMove(window, {
      touches: [{ clientX: width - 90, clientY: 310 }],
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('화면 가운데에서 시작하거나 문이 닫혀 있으면 화면 끝 밀기로 아무것도 하지 않는다', () => {
    const { onOpenChange } = renderDoors(true);
    fireEvent.touchStart(window, { touches: [{ clientX: 300, clientY: 300 }] });
    fireEvent.touchMove(window, { touches: [{ clientX: 200, clientY: 300 }] });
    cleanup();
    const closed = renderDoors(false);
    fireEvent.touchStart(window, { touches: [{ clientX: 2, clientY: 300 }] });
    fireEvent.touchMove(window, { touches: [{ clientX: 120, clientY: 300 }] });
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(closed.onOpenChange).not.toHaveBeenCalled();
  });
});
