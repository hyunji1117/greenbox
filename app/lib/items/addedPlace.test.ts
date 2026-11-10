// app/lib/items/addedPlace.test.ts

import { describe, expect, it } from 'vitest';
import { addedPlaceMessage, categoryToShow, placeLabel } from './addedPlace';

describe('placeLabel', () => {
  it('냉장고 이름과 칸 이름을 붙이고, 이름을 모르면 칸 이름만 쓴다', () => {
    expect(placeLabel('기흥 냉장고', 'freezer')).toBe('기흥 냉장고 냉동실');
    expect(placeLabel(undefined, 'pantry')).toBe('상온');
    expect(placeLabel('  ', 'fridge')).toBe('냉장실');
  });
});

describe('categoryToShow', () => {
  it('냉장실을 보고 있는데 모두 냉동실에 들어갔으면 냉동실을 보여 준다', () => {
    expect(categoryToShow('fridge', ['freezer'])).toBe('freezer');
    expect(categoryToShow('fridge', ['freezer', 'pantry'])).toBe('freezer');
  });

  it('지금 칸에 하나라도 들어갔거나 넣은 것이 없으면 칸을 바꾸지 않는다', () => {
    expect(categoryToShow('fridge', ['freezer', 'fridge'])).toBeNull();
    expect(categoryToShow('freezer', ['freezer'])).toBeNull();
    expect(categoryToShow('fridge', [])).toBeNull();
  });
});

describe('addedPlaceMessage', () => {
  it('한 칸이면 냉장고와 칸, 개수를 함께 알린다', () => {
    expect(addedPlaceMessage('기흥 냉장고', ['freezer', 'freezer'])).toBe(
      '기흥 냉장고 냉동실에 2개를 넣었어요',
    );
  });

  it('여러 칸이면 칸별 개수를 알린다', () => {
    expect(
      addedPlaceMessage('기흥 냉장고', ['fridge', 'freezer', 'fridge']),
    ).toBe('기흥 냉장고에 냉장실 2개, 냉동실 1개를 넣었어요');
  });
});
