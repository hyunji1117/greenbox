// app/lib/recipes/suggest.test.ts

import { describe, expect, it } from 'vitest';
import type { HomeRecipe } from '@/app/lib/recipes/homeRecipes';
import { seasonOf, suggestRecipes } from './suggest';

const recipe = (
  id: string,
  names: string[],
  extra: Partial<HomeRecipe> = {},
): HomeRecipe => ({
  id,
  title: id,
  minutes: 10,
  ingredients: names.map(name => ({ name, amount: '1' })),
  steps: ['a'],
  seasons: [],
  moods: [],
  ...extra,
});

const now = new Date('2026-11-13T12:00:00+09:00');

describe('suggestRecipes', () => {
  it('곧 먹어야 할 재료를 쓰는 요리를 먼저, 있는 재료와 빠진 재료를 나눠 준다', () => {
    const result = suggestRecipes({
      items: [
        { name: '방울토마토', finished: false, expiryDate: '2026-11-14' },
        { name: '계란', finished: false, expiryDate: '2026-12-01' },
        { name: '두부', finished: true, expiryDate: '2026-11-13' },
      ],
      season: 'autumn',
      mood: null,
      now,
      recipes: [
        recipe('tofu', ['두부', '대파']),
        recipe('egg', ['계란', '대파']),
        recipe('tomato-egg', ['토마토', '계란', '대파']),
      ],
    });
    expect(result.map(s => s.recipe.id)).toEqual(['tomato-egg', 'egg', 'tofu']);
    expect(result[0]).toMatchObject({
      have: ['토마토', '계란'],
      missing: ['대파'],
      usesSoon: ['토마토'],
    });
    // 다 먹은 두부는 냉장고에 없는 것으로 본다
    expect(result[2].missing).toEqual(['두부', '대파']);
  });

  it('재료가 같으면 계절과 날씨가 맞는 요리를 먼저 고르고, 3개까지만 준다', () => {
    const result = suggestRecipes({
      items: [],
      season: 'winter',
      mood: 'cold',
      now,
      recipes: [
        recipe('summer', ['오이'], { seasons: ['summer'] }),
        recipe('any', ['무']),
        recipe('winter-soup', ['무'], { seasons: ['winter'], moods: ['cold'] }),
        recipe('cold', ['무'], { moods: ['cold'] }),
      ],
    });
    expect(result.map(s => s.recipe.id)).toEqual([
      'winter-soup',
      'cold',
      'any',
    ]);
  });
});

describe('seasonOf', () => {
  it('3~5월 봄, 6~8월 여름, 9~11월 가을, 12~2월 겨울', () => {
    expect(seasonOf(new Date(2026, 2, 1))).toBe('spring');
    expect(seasonOf(new Date(2026, 7, 31))).toBe('summer');
    expect(seasonOf(new Date(2026, 10, 13))).toBe('autumn');
    expect(seasonOf(new Date(2026, 0, 5))).toBe('winter');
  });
});
