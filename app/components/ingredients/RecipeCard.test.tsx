// app/components/ingredients/RecipeCard.test.tsx

import React from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RECIPE_POLICY_VERSION } from '@/app/lib/consent/policies';

const mocks = vi.hoisted(() => ({ mutateAsync: vi.fn(), isPending: false }));
vi.mock('@/app/lib/recipes/useTodayRecipe', () => ({
  useTodayRecipe: () => ({
    data: { available: true, soonNames: ['두부'], recipe: null },
  }),
  useMakeRecipe: () => ({
    mutateAsync: mocks.mutateAsync,
    get isPending() {
      return mocks.isPending;
    },
    isError: false,
  }),
}));
vi.mock('@/app/components/ingredients/RecipeSheet', () => ({
  default: () => null,
}));

import RecipeCard, { RECIPE_AGREED_KEY } from './RecipeCard';

beforeEach(() => {
  mocks.isPending = false;
  localStorage.clear();
  mocks.mutateAsync.mockReset();
  mocks.mutateAsync.mockResolvedValue(null);
});
afterEach(cleanup);

describe('RecipeCard', () => {
  it('처음 만들 때는 해외로 보내는 것에 동의를 받고, 동의 전에는 만들지 않는다', () => {
    render(<RecipeCard />);
    fireEvent.click(screen.getByRole('button', { name: /레시피 만들기/ }));

    expect(screen.getByText(/Anthropic\(미국\)에, 요리와/)).toBeTruthy();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '동의하고 계속' }));
    expect(localStorage.getItem(RECIPE_AGREED_KEY)).toBe(RECIPE_POLICY_VERSION);
    fireEvent.click(screen.getByRole('button', { name: /레시피 만들기/ }));
    expect(mocks.mutateAsync).toHaveBeenCalledTimes(1);
  });

  it('카드에서부터 AI 추천임을 보이고, 동의 화면에서 생성형 AI가 글과 그림을 만든다고 미리 알린다', () => {
    render(<RecipeCard />);
    expect(screen.getByText('AI 추천')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /레시피 만들기/ }));
    expect(screen.getByText(/생성형 AI가 레시피 글/)).toBeTruthy();
  });

  it('이미 동의한 기기에서는 바로 만든다', () => {
    localStorage.setItem(RECIPE_AGREED_KEY, RECIPE_POLICY_VERSION);
    render(<RecipeCard />);
    fireEvent.click(screen.getByRole('button', { name: /레시피 만들기/ }));
    expect(mocks.mutateAsync).toHaveBeenCalledTimes(1);
  });

  it('만드는 동안 보통 걸리는 시간과 할 일을 보여 주고, 그 시간을 넘기면 거의 다 됐다고 바꾼다', () => {
    vi.useFakeTimers();
    mocks.isPending = true;
    render(<RecipeCard />);
    expect(screen.getByRole('status').textContent).toContain(
      '보통 5초쯤 걸려요. 그동안 두부를 꺼내 두면',
    );
    act(() => {
      vi.advanceTimersByTime(7000);
    });
    expect(screen.getByRole('status').textContent).toContain('거의 다 됐어요');
    vi.useRealTimers();
  });
});
