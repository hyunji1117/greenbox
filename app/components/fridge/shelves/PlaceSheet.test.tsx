// app/components/fridge/shelves/PlaceSheet.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Item } from '@/app/lib/schemas/item';
import PlaceSheet from './PlaceSheet';

const counts = { fridge: 5, freezer: 3, pantry: 2 };

const item = (
  id: string,
  name: string,
  shelf: number,
  expiryDate: string,
  category: Item['category'] = 'freezer',
): Item => ({
  id,
  name,
  category,
  quantity: 1,
  eatenQuantity: 0,
  addedBy: { id: '7', name: '현지', isMember: true },
  addedAt: new Date(),
  comments: [],
  finished: false,
  expiryDate,
  watched: false,
  shelf,
  updatedAt: null,
  unit: null,
});

afterEach(cleanup);

// 냉동실 2번 선반에 34개 (가득 30, 최대 50). 임박한 것 몇 개를 섞는다
const crowded = [
  item('a', '떡국떡', 2, '2099-01-05'),
  item('b', '냉동 새우', 2, '2099-01-02'),
  item('c', '갈비', 2, '2099-02-01'),
  item('d', '어묵', 2, '2099-01-03'),
  ...Array.from({ length: 30 }, (_, i) =>
    item(`x${i}`, '얼음', 2, '2099-06-01'),
  ),
];

describe('PlaceSheet', () => {
  it('가득 찬 선반을 고르면 막지 않고, 임박한 것을 보여 준 뒤 그래도 넣는다', () => {
    const onPlace = vi.fn();
    render(
      <PlaceSheet
        name="만두"
        category="freezer"
        counts={counts}
        items={crowded}
        onPlace={onPlace}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByRole('radio', { name: '2번 선반, 가득, 34개' }),
    );
    expect(onPlace).not.toHaveBeenCalled();
    expect(screen.getByText('냉동실 2번 선반이 가득 찼어요')).toBeTruthy();

    // 유통기한이 가까운 순서로 3개만 먼저
    const soon = screen.getByRole('list', { name: '유통기한 임박한 식재료' });
    expect(
      Array.from(soon.querySelectorAll('li')).map(
        li => li.firstChild?.textContent,
      ),
    ).toEqual(['냉동 새우', '어묵', '떡국떡']);
    fireEvent.click(screen.getByRole('button', { name: '유통기한 임박 보기' }));
    expect(soon.querySelectorAll('li')).toHaveLength(34);

    fireEvent.click(screen.getByRole('button', { name: '그래도 넣기' }));
    expect(onPlace).toHaveBeenCalledWith(2);
  });

  it('다른 자리 고르기로 지도로 돌아가고, 여유 있는 선반은 바로 넣는다', () => {
    const onPlace = vi.fn();
    render(
      <PlaceSheet
        name="만두"
        category="freezer"
        counts={counts}
        items={crowded}
        onPlace={onPlace}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByRole('radio', { name: '2번 선반, 가득, 34개' }),
    );
    fireEvent.click(screen.getByRole('button', { name: '다른 자리 고르기' }));
    fireEvent.click(screen.getByRole('radio', { name: '3번 선반, 0개' }));
    expect(onPlace).toHaveBeenCalledWith(3);
  });

  it('추천은 가득 찬 선반을 피한다', () => {
    render(
      <PlaceSheet
        name="만두"
        category="freezer"
        counts={counts}
        items={crowded}
        onPlace={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('냉동실 맨 위 1번 선반')).toBeTruthy();
  });

  it('같은 이름이 이미 있으면 먼저 알리고, 그 버섯이에요면 새로 넣지 않는다', () => {
    const onPlace = vi.fn();
    const onUseExisting = vi.fn();
    const mushroom = {
      ...item('m', '버섯', 5, '2099-01-10', 'fridge'),
      autoPlaced: true,
    };
    render(
      <PlaceSheet
        name="버섯"
        category="fridge"
        counts={counts}
        items={[mushroom]}
        onPlace={onPlace}
        onClose={vi.fn()}
        onUseExisting={onUseExisting}
      />,
    );
    expect(screen.getByText('냉장고에 버섯이 이미 있어요')).toBeTruthy();
    expect(
      screen.getByText(/냉장실 맨 아래 5번 선반 · 앱이 넣어 둠/),
    ).toBeTruthy();
    // 지도는 아직 보이지 않는다
    expect(screen.queryByRole('radiogroup')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '그 버섯이에요' }));
    expect(onUseExisting).toHaveBeenCalledWith(mushroom);
    expect(onPlace).not.toHaveBeenCalled();
  });

  it('하나 더 넣기면 평소처럼 자리를 고른다', () => {
    const onPlace = vi.fn();
    render(
      <PlaceSheet
        name="두부"
        category="fridge"
        counts={counts}
        items={[item('t', '두부', 3, '2099-01-10', 'fridge')]}
        onPlace={onPlace}
        onClose={vi.fn()}
        onUseExisting={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: '그 두부예요' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '하나 더 넣기' }));
    fireEvent.click(screen.getByRole('button', { name: '추천 자리에 넣기' }));
    expect(onPlace).toHaveBeenCalledWith(3);
  });
});
