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

  it('실제 식재료 이름만 다시 사자고 제안한다 (잘못 들어간 이름은 빼기)', () => {
    expect(
      getRebuySuggestions(
        [item('오', true), item('브로콜리', true), item('유기농 우유', true)],
        'fridge',
      ),
    ).toEqual(['브로콜리', '유기농 우유']);
  });
});
