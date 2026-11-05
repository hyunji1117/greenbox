// app/lib/schemas/fridge.test.ts

import { describe, expect, it } from 'vitest';
import { FridgeNameSchema, toFridgeLabel, toFridgeName } from './fridge';

describe('냉장고 이름', () => {
  it('앞 이름에 "냉장고"를 붙여 저장하고, 이미 붙여 써도 두 번 붙지 않는다', () => {
    expect(toFridgeName('본가')).toBe('본가 냉장고');
    expect(toFridgeName(' 본가 냉장고 ')).toBe('본가 냉장고');
    expect(toFridgeName('자취방냉장고')).toBe('자취방 냉장고');
  });

  it('지금 이름에서 칸에 보일 앞 이름을 꺼낸다', () => {
    expect(toFridgeLabel('떡자 냉장고')).toBe('떡자');
    expect(toFridgeLabel('호스트')).toBe('호스트');
  });

  it('앞 이름은 1자 이상 8자 이하만 받는다', () => {
    expect(FridgeNameSchema.safeParse({ label: '냉장고' }).success).toBe(false);
    expect(
      FridgeNameSchema.safeParse({ label: '가나다라마바사아' }).success,
    ).toBe(true);
    expect(
      FridgeNameSchema.safeParse({ label: '가나다라마바사아자' }).success,
    ).toBe(false);
  });
});
