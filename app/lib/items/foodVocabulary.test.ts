// app/lib/items/foodVocabulary.test.ts

import { describe, expect, it } from 'vitest';
import { checkFoodName } from './foodVocabulary';

describe('checkFoodName', () => {
  it('아는 식재료 이름이 들어 있으면 그대로 쓴다', () => {
    expect(checkFoodName('오이')).toEqual({ status: 'known', name: '오이' });
    expect(checkFoodName('유기농 우유')).toEqual({
      status: 'known',
      name: '유기농 우유',
    });
    expect(checkFoodName('무')).toEqual({ status: 'known', name: '무' });
  });

  it('말하는 도중 글자나 식재료가 아닌 말은 모르는 이름으로 본다', () => {
    expect(checkFoodName('오').status).toBe('unknown');
    expect(checkFoodName('어제 뭐 먹지').status).toBe('unknown');
    // 한 글자 식재료(무)가 다른 말 안에 들어 있어도 식재료로 보지 않는다
    expect(checkFoodName('무엇').status).toBe('unknown');
  });

  it('세 글자 이상에서 한 글자 틀리면 아는 이름으로 고치고, 집마다 쓰는 이름도 안다', () => {
    expect(checkFoodName('파프리가')).toEqual({
      status: 'corrected',
      name: '파프리카',
      heard: '파프리가',
    });
    expect(checkFoodName('엄마표 장아찌', ['엄마표 장아찌']).status).toBe(
      'known',
    );
  });
});
