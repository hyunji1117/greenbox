// app/components/ingredients/RecipeCard.test.tsx

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RECIPE_POLICY_VERSION } from '@/app/lib/consent/policies';

const mocks = vi.hoisted(() => ({ mutateAsync: vi.fn() }));
vi.mock('@/app/lib/recipes/useTodayRecipe', () => ({
  useTodayRecipe: () => ({
    data: { available: true, soonNames: ['두부'], recipe: null },
  }),
  useMakeRecipe: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: false,
    isError: false,
  }),
}));
vi.mock('@/app/components/ingredients/RecipeSheet', () => ({
  default: () => null,
}));

import RecipeCard, { RECIPE_AGREED_KEY } from './RecipeCard';

beforeEach(() => {
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

  it('이미 동의한 기기에서는 바로 만든다', () => {
    localStorage.setItem(RECIPE_AGREED_KEY, RECIPE_POLICY_VERSION);
    render(<RecipeCard />);
    fireEvent.click(screen.getByRole('button', { name: /레시피 만들기/ }));
    expect(mocks.mutateAsync).toHaveBeenCalledTimes(1);
  });
});
