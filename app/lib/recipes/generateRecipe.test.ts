// app/lib/recipes/generateRecipe.test.ts

import { describe, expect, it } from 'vitest';
import { normalizeRecipe } from './generateRecipe';

describe('normalizeRecipe', () => {
  it('빈 단계와 재료를 빼고 길이, 개수, 시간을 화면 규칙에 맞춘다', () => {
    const recipe = normalizeRecipe({
      title: '  두부 부침  ',
      minutes: 500,
      ingredients: [
        { name: '두부', amount: '1모', have: true },
        { name: ' ', amount: '', have: false },
      ],
      steps: ['자른다', '', '굽는다', 'a', 'b', 'c', 'd', 'e'],
      caution: ' ',
    });
    expect(recipe).toEqual({
      title: '두부 부침',
      minutes: 120,
      ingredients: [{ name: '두부', amount: '1모', have: true }],
      steps: ['자른다', '굽는다', 'a', 'b', 'c', 'd'].map(text => ({ text })),
      caution: null,
    });
  });

  it('단계나 재료가 없으면 쓸 수 없는 레시피로 본다', () => {
    expect(
      normalizeRecipe({
        title: 'x',
        minutes: 5,
        ingredients: [],
        steps: ['a'],
        caution: '',
      }),
    ).toBeNull();
  });
});
