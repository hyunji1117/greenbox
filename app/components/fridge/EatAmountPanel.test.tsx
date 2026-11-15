// app/components/fridge/EatAmountPanel.test.tsx

import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EatAmountPanel, { initialEatAmount } from './EatAmountPanel';

const Harness: React.FC<{
  unit: string;
  remaining: number;
  onConfirm: (v: number) => void;
}> = ({ unit, remaining, onConfirm }) => {
  const [value, setValue] = useState(initialEatAmount(unit, remaining));
  return (
    <EatAmountPanel
      itemName="삼겹살"
      unit={unit}
      remaining={remaining}
      value={value}
      onChange={setValue}
      onConfirm={() => onConfirm(value)}
    />
  );
};

afterEach(cleanup);

describe('EatAmountPanel', () => {
  it('g 품목은 100g부터 시작해 100g씩 늘고, 반을 누르면 남은 양의 절반을 고른다', () => {
    const onConfirm = vi.fn();
    render(<Harness unit="g" remaining={600} onConfirm={onConfirm} />);
    expect(screen.getByText('얼마나 먹었어요?')).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: '삼겹살 먹은 양 늘리기' }),
    );
    expect(screen.getByRole('button', { name: '200g 먹음' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '반' }));
    fireEvent.click(screen.getByRole('button', { name: '300g 먹음' }));
    expect(onConfirm).toHaveBeenCalledWith(300);
  });

  it('남은 만큼 고르면 모두 먹음으로 바뀌고, 개수 단위는 1개부터 시작한다', () => {
    render(<Harness unit="g" remaining={80} onConfirm={vi.fn()} />);
    expect(screen.getByRole('button', { name: '모두 먹음' })).toBeTruthy();
    cleanup();
    render(<Harness unit="팩" remaining={3} onConfirm={vi.fn()} />);
    expect(screen.getByText('몇 팩 먹었어요?')).toBeTruthy();
    expect(screen.getByRole('button', { name: '1팩 먹음' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '반' })).toBeNull();
  });
});
