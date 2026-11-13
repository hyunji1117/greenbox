// app/lib/items/units.test.ts

import { describe, expect, it } from 'vitest';
import { unitFor, withUnit } from './units';

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
