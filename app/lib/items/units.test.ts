// app/lib/items/units.test.ts

import { describe, expect, it } from 'vitest';
import {
  quantityAfterUnitChange,
  quantityLimits,
  unitFor,
  withUnit,
} from './units';

describe('unitFor', () => {
  it('마트에서 쓰는 단위를 고르고, 표에 없으면 개', () => {
    expect(withUnit(30, '계란')).toBe('30구');
    expect(withUnit(1, '부침두부')).toBe('1모');
    expect(withUnit(2, '대파')).toBe('2단');
    expect(withUnit(3, '사과')).toBe('3개');
  });

  it('이름 안에 든 가장 긴 재료 이름을 따른다', () => {
    // 김치는 김(봉)이 아니라 통, 닭가슴살은 닭(마리)이 아니라 팩, 배추는 배가 아니라 포기
    expect(unitFor('포기김치')).toBe('통');
    expect(unitFor('닭가슴살')).toBe('팩');
    expect(unitFor('양배추')).toBe('통');
    expect(unitFor('알배추')).toBe('포기');
    expect(unitFor('냉동만두')).toBe('봉');
  });
});

describe('고른 단위와 g', () => {
  it('고른 단위가 있으면 그것을, 없으면 이름으로 추정한다', () => {
    expect(unitFor('계란')).toBe('구');
    expect(unitFor('계란', '개')).toBe('개');
    expect(withUnit(600, '삼겹살', 'g')).toBe('600g');
    expect(withUnit(1, '두부', null)).toBe('1모');
  });

  it('g은 9999까지 100g씩, 개수는 99까지 1씩 움직인다', () => {
    expect(quantityLimits('g')).toEqual({ max: 9999, step: 100 });
    expect(quantityLimits('팩')).toEqual({ max: 99, step: 1 });
  });

  it('개수와 g 사이를 오갈 때만 수량을 새로 채운다', () => {
    expect(quantityAfterUnitChange('팩', 'g', 2)).toBe(500);
    expect(quantityAfterUnitChange('g', '팩', 600)).toBe(1);
    expect(quantityAfterUnitChange('개', '구', 30)).toBe(30);
  });
});
