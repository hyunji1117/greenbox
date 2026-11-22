// app/components/fridge/shelves/ShelfMapPicker.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Item } from '@/app/lib/schemas/item';
import ShelfMapPicker, { currentPlaceLabel } from './ShelfMapPicker';

const item = (
  id: string,
  shelf: number | null,
  overrides: Partial<Item> = {},
): Item => ({
  id,
  name: '두부',
  category: 'fridge',
  quantity: 1,
  eatenQuantity: 0,
  addedBy: { id: '7', name: '현지', isMember: true },
  addedAt: new Date(),
  comments: [],
  finished: false,
  expiryDate: '2026-11-30',
  watched: false,
  shelf,
  updatedAt: null,
  unit: null,
  ...overrides,
});

const counts = { freezer: 3, fridge: 4, pantry: 2 };

afterEach(cleanup);

describe('ShelfMapPicker', () => {
  it('지금 칸 수대로 선반을 그리고, 고르는 칸의 선반만 누를 수 있다', () => {
    const me = item('1', 2);
    const onPick = vi.fn();
    render(
      <ShelfMapPicker
        category="fridge"
        name="두부"
        current={2}
        items={[me]}
        counts={counts}
        onPick={onPick}
      />,
    );
    const group = screen.getByRole('radiogroup', { name: '두부 선반 고르기' });
    // 냉장실 4칸만 고를 수 있다 (냉동실 3칸, 상온 2칸은 위치만 보여 준다)
    expect(group.querySelectorAll('[role="radio"]')).toHaveLength(4);
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    expect(
      screen
        .getByRole('radio', { name: '2번 선반, 지금 여기' })
        .getAttribute('aria-checked'),
    ).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: '4번 선반, 0개' }));
    expect(onPick).toHaveBeenCalledWith(4, 'fridge');
    // 선반 미정으로 되돌리는 선택은 없다
    expect(screen.queryByRole('button', { name: /선반 미정/ })).toBeNull();
  });

  it('추천 선반에는 추천 배지를 단다', () => {
    render(
      <ShelfMapPicker
        category="fridge"
        name="오이"
        current={null}
        recommended={4}
        items={[]}
        counts={counts}
        onPick={vi.fn()}
      />,
    );
    const rec = screen.getByRole('radio', { name: '4번 선반, 추천, 0개' });
    expect(rec.textContent).toContain('추천');
  });

  it('가득 찬 선반(냉장 20개)은 노란색으로 알리되 고를 수 있고, 최대(30개)는 막는다', () => {
    const full = Array.from({ length: 20 }, (_, i) => item(`f${i}`, 3));
    const max = Array.from({ length: 30 }, (_, i) => item(`m${i}`, 4));
    const onPick = vi.fn();
    render(
      <ShelfMapPicker
        category="fridge"
        name="두부"
        current={1}
        items={[...full, ...max]}
        counts={counts}
        onPick={onPick}
      />,
    );
    const fullShelf = screen.getByRole('radio', {
      name: '3번 선반, 가득, 20개',
    });
    expect((fullShelf as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(fullShelf);
    expect(onPick).toHaveBeenCalledWith(3, 'fridge');

    const maxShelf = screen.getByRole('radio', {
      name: '4번 선반, 최대까지 참',
    });
    expect((maxShelf as HTMLButtonElement).disabled).toBe(true);
  });

  it('냉동실은 30개부터 가득, 50개까지 넣을 수 있다', () => {
    const frozen = Array.from({ length: 34 }, (_, i) =>
      item(`z${i}`, 2, { category: 'freezer', name: '만두' }),
    );
    render(
      <ShelfMapPicker
        category="freezer"
        name="만두"
        current={null}
        items={frozen}
        counts={counts}
        onPick={vi.fn()}
      />,
    );
    const shelf = screen.getByRole('radio', { name: '2번 선반, 가득, 34개' });
    expect((shelf as HTMLButtonElement).disabled).toBe(false);
  });
});

describe('ShelfMapPicker 옮길 자리', () => {
  it('지금 자리는 그대로 두고, 고른 선반에 이동 표시를 붙인다', () => {
    render(
      <ShelfMapPicker
        category="fridge"
        name="두부"
        current={4}
        pending={{ category: 'fridge', shelf: 2 }}
        items={[]}
        counts={counts}
        onPick={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('radio', { name: '4번 선반, 지금 여기' }),
    ).toBeTruthy();
    const target = screen.getByRole('radio', { name: '2번 선반, 옮길 자리' });
    expect(target.textContent).toContain('이동');
    expect(target.getAttribute('aria-checked')).toBe('true');
  });
});

describe('currentPlaceLabel', () => {
  it('선반이 없는 품목은 아직 정하지 않았다고 알린다', () => {
    expect(currentPlaceLabel({ category: 'pantry', shelf: null })).toBe(
      '상온, 아직 선반을 정하지 않았어요',
    );
    expect(currentPlaceLabel({ category: 'fridge', shelf: 2 })).toBe(
      '냉장실 2번 선반',
    );
  });
});
