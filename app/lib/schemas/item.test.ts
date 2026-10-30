// app/lib/schemas/item.test.ts

import { describe, expect, it } from 'vitest';
import { CreateItemSchema, ItemSchema, UpdateItemSchema } from './item';

const validItemJson = {
  id: '1',
  name: '우유',
  category: 'fridge',
  quantity: 1,
  addedBy: 'mom',
  addedAt: '2026-10-30T03:00:00.000Z',
  comments: [
    {
      id: '101',
      text: '이거 내일 아침에 먹을거야~',
      author: 'littleKid',
      createdAt: '2026-10-30T04:00:00.000Z',
    },
  ],
  finished: false,
  expiryDate: null,
};

describe('ItemSchema (응답)', () => {
  it('JSON 날짜를 Date로, null 유통기한을 undefined로 바꾼다', () => {
    const item = ItemSchema.parse(validItemJson);

    expect(item.addedAt).toBeInstanceOf(Date);
    expect(item.comments[0].createdAt).toBeInstanceOf(Date);
    expect(item.expiryDate).toBeUndefined();
  });

  it('서버가 약속에 없는 분류를 보내면 실패한다', () => {
    const result = ItemSchema.safeParse({
      ...validItemJson,
      category: 'kimchi',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['category']);
  });
});

describe('CreateItemSchema (요청)', () => {
  it('공백뿐인 이름과 범위를 벗어난 수량을 거절한다', () => {
    const result = CreateItemSchema.safeParse({
      name: '   ',
      category: 'fridge',
      quantity: 0,
      addedBy: 'mom',
    });

    expect(result.success).toBe(false);
    const paths = result.error?.issues.map(issue => issue.path[0]);
    expect(paths).toEqual(expect.arrayContaining(['name', 'quantity']));
  });
});

describe('UpdateItemSchema (요청)', () => {
  it('바꿀 항목이 없는 빈 요청을 거절한다', () => {
    expect(UpdateItemSchema.safeParse({}).success).toBe(false);
    expect(UpdateItemSchema.safeParse({ finished: true }).success).toBe(true);
  });
});
