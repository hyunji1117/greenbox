// app/components/fridge/UnitChooser.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { track } = vi.hoisted(() => ({ track: vi.fn() }));
vi.mock('@/app/lib/analytics/gtag', () => ({ track }));

import UnitChooser from './UnitChooser';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('UnitChooser', () => {
  it('이름으로 추정한 단위를 보여 주고, g으로 바꾸면 500g으로 채운다', () => {
    const onChange = vi.fn();
    render(
      <UnitChooser
        name="삼겹살"
        unit={null}
        quantity={2}
        eatenQuantity={0}
        onChange={onChange}
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: '삼겹살 단위 팩, 바꾸기' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'g' }));
    expect(onChange).toHaveBeenCalledWith({ unit: 'g', quantity: 500 });
    expect(track).toHaveBeenCalledWith('item_unit_set', {
      unit: 'g',
      suggested: false,
    });
  });

  it('먹은 기록이 있으면 단위를 바꾸지 않는다', () => {
    const onChange = vi.fn();
    render(
      <UnitChooser
        name="계란"
        unit={null}
        quantity={30}
        eatenQuantity={3}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /계란 단위/ }));
    expect(
      screen.getByText('먹은 기록이 있어 단위를 바꿀 수 없어요'),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'g' })).toBeNull();
  });
});
