// app/lib/items/storageGuide.test.ts

import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DAYS,
  recommendedDays,
  recommendedExpiryDate,
} from './storageGuide';

describe('recommendedDays', () => {
  it('이름과 보관 위치로 권장 일수를 찾는다', () => {
    expect(recommendedDays('우유', 'fridge')).toBe(5);
    expect(recommendedDays('두부', 'fridge')).toBe(3);
    expect(recommendedDays('연어', 'freezer')).toBe(90);
    expect(recommendedDays('바나나', 'pantry')).toBe(5);
  });

  it('이름에 낱말이 들어 있으면 긴 낱말부터 맞춘다', () => {
    expect(recommendedDays('국내산 닭가슴살', 'fridge')).toBe(2);
    expect(recommendedDays('양배추', 'fridge')).toBe(14);
    expect(recommendedDays('아보카도 오일', 'pantry')).toBe(180);
    expect(recommendedDays('토마토 소스', 'fridge')).toBe(7);
  });

  it('표에 없거나 그 보관 위치 기간이 없으면 보관 위치 기본값을 쓴다', () => {
    expect(recommendedDays('처음 보는 식재료', 'fridge')).toBe(
      DEFAULT_DAYS.fridge,
    );
    expect(recommendedDays('감자', 'freezer')).toBe(DEFAULT_DAYS.freezer);
  });
});

describe('recommendedExpiryDate', () => {
  it('오늘에 권장 일수를 더한다 (달이 바뀌어도)', () => {
    expect(recommendedExpiryDate('두부', 'fridge', '2026-11-29')).toBe(
      '2026-12-02',
    );
  });
});
