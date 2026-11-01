// app/lib/items/suggestions.test.ts

import { describe, expect, it } from 'vitest';
import type { Item } from '@/app/lib/schemas/item';
import { getHomeSuggestions, getRebuySuggestions } from './suggestions';

const item = (name: string, finished: boolean, category = 'fridge') =>
  ({ name, finished, category }) as Item;

describe('getHomeSuggestions', () => {
  it('칸에 이미 있는 품목은 빼고 입력한 글자로 거른다', () => {
    expect(getHomeSuggestions([item('우유', false)], 'fridge')).not.toContain(
      '우유',
    );
    expect(getHomeSuggestions([], 'fridge', ' 당')).toEqual(['당근']);
  });

  it('전에 먹은 품목은 넣지 않는다', () => {
    expect(
      getHomeSuggestions([item('꽈리고추', true)], 'fridge'),
    ).not.toContain('꽈리고추');
  });
});

describe('getRebuySuggestions', () => {
  it('전에 먹은 품목을 중복 없이 보여 준다', () => {
    expect(
      getRebuySuggestions([item('두부', true), item('두부', true)], 'fridge'),
    ).toEqual(['두부']);
  });

  it('지금 칸에 있으면 빼고 다른 칸의 이력은 섞지 않는다', () => {
    expect(
      getRebuySuggestions(
        [
          item('우유', false),
          item('우유', true),
          item('만두', true, 'freezer'),
        ],
        'fridge',
      ),
    ).toEqual([]);
  });
});
