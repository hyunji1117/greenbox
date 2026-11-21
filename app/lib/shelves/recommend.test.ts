import { describe, expect, it } from 'vitest';
import type { Item } from '@/app/lib/schemas/item';
import {
  foodGroupOf,
  recommendPlace,
  shelfLoads,
  shelfPlaceName,
} from './recommend';

const counts = { fridge: 5, freezer: 3, pantry: 2 };

const item = (
  id: string,
  name: string,
  shelf: number | null,
  overrides: Partial<Item> = {},
): Item => ({
  id,
  name,
  category: 'fridge',
  quantity: 1,
  eatenQuantity: 0,
  addedBy: { id: '7', name: '현지', isMember: true },
  addedAt: new Date('2026-11-10'),
  comments: [],
  finished: false,
  expiryDate: '2026-11-30',
  watched: false,
  shelf,
  updatedAt: null,
  unit: null,
  ...overrides,
});

describe('foodGroupOf', () => {
  it('식재료 이름으로 무리를 고른다', () => {
    expect(foodGroupOf('오이')).toBe('produce');
    expect(foodGroupOf('삼겹살 600g')).toBe('meat');
    expect(foodGroupOf('두부')).toBe('dairy');
    expect(foodGroupOf('어제 남은 잡채')).toBe('ready');
    expect(foodGroupOf('오렌지 주스')).toBe('drink');
  });

  it('한 글자 이름은 같을 때만, 소스는 채소보다 먼저 본다', () => {
    expect(foodGroupOf('배')).toBe('produce');
    expect(foodGroupOf('배추')).toBe('produce');
    expect(foodGroupOf('배달음식')).toBeNull();
    expect(foodGroupOf('고추장')).toBe('drink');
    expect(foodGroupOf('고추')).toBe('produce');
    expect(foodGroupOf('무')).toBe('produce');
    expect(foodGroupOf('무지개떡')).toBeNull();
  });
});

describe('recommendPlace', () => {
  it('냉장실은 채소는 맨 아래, 고기는 그 위, 유제품은 가운데, 반찬과 음료는 맨 위', () => {
    expect(recommendPlace('오이', 'fridge', counts, []).shelf).toBe(5);
    expect(recommendPlace('삼겹살', 'fridge', counts, []).shelf).toBe(4);
    expect(recommendPlace('우유', 'fridge', counts, []).shelf).toBe(3);
    expect(recommendPlace('김치', 'fridge', counts, []).shelf).toBe(1);
    expect(recommendPlace('콜라', 'fridge', counts, []).shelf).toBe(1);
  });

  it('이유는 한 줄로 함께 준다', () => {
    expect(recommendPlace('오이', 'fridge', counts, []).reason).toBe(
      '맨 아래 칸은 찬 바람을 덜 맞아 채소가 덜 말라요',
    );
  });

  it('전에 같은 이름을 둔 선반이 있으면 그 자리를 먼저 추천한다', () => {
    const items = [
      item('1', '오이', 2, { finished: true }),
      item('2', '오이', 3, {
        finished: true,
        addedAt: new Date('2026-11-15'),
      }),
    ];
    expect(recommendPlace('오이', 'fridge', counts, items)).toEqual({
      shelf: 3,
      reason: '전에 넣어 둔 자리예요',
    });
  });

  it('추천 선반이 꽉 차면 가장 여유 있는 선반으로 바꾼다', () => {
    const full = Array.from({ length: 20 }, (_, i) => item(`f${i}`, '두부', 5));
    const busy = [
      item('a', '김치', 1),
      item('b', '김치', 2),
      item('c', '김치', 3),
    ];
    expect(
      recommendPlace('오이', 'fridge', counts, [...full, ...busy]),
    ).toEqual({
      shelf: 4,
      reason: '지금 가장 여유 있는 선반이에요',
    });
  });

  it('냉동실과 상온, 모르는 식재료는 가장 여유 있는 선반', () => {
    const items = [item('1', '만두', 1, { category: 'freezer' })];
    expect(recommendPlace('만두', 'freezer', counts, items).shelf).toBe(1);
    expect(recommendPlace('새 만두', 'freezer', counts, items).shelf).toBe(2);
    expect(recommendPlace('라면', 'pantry', counts, []).shelf).toBe(1);
  });
});

describe('shelfLoads', () => {
  it('다 먹은 품목과 선반 없는 품목은 빼고 센다', () => {
    const items = [
      item('1', '우유', 1),
      item('2', '우유', 1, { finished: true }),
      item('3', '우유', null),
    ];
    expect(shelfLoads(items, 'fridge', 3)).toEqual([1, 0, 0]);
  });
});

describe('shelfPlaceName', () => {
  it('맨 위와 맨 아래는 위치로도 부른다', () => {
    expect(shelfPlaceName('fridge', 5, 5)).toBe('냉장실 맨 아래 5번 선반');
    expect(shelfPlaceName('fridge', 1, 5)).toBe('냉장실 맨 위 1번 선반');
    expect(shelfPlaceName('freezer', 2, 3)).toBe('냉동실 2번 선반');
  });
});
