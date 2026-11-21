import { describe, expect, it } from 'vitest';
import { planAutoPlacement, type PlaceableItem } from './autoPlace';

const counts = { fridge: 5, freezer: 3, pantry: 2 };
const item = (
  id: string,
  name: string,
  shelf: number | null,
  overrides: Partial<PlaceableItem> = {},
): PlaceableItem => ({
  id,
  name,
  category: 'fridge',
  shelf,
  finished: false,
  addedAt: new Date(
    `2026-11-${String(10 + (Number(id.replace(/\D/g, '') || 0) % 15)).padStart(2, '0')}`,
  ),
  ...overrides,
});

describe('planAutoPlacement', () => {
  it('선반 없는 품목만 추천 자리에 놓는다 (다 먹은 품목과 이미 놓인 품목은 그대로)', () => {
    const plan = planAutoPlacement(
      [
        item('1', '오이', null),
        item('2', '삼겹살', null),
        item('3', '우유', 2),
        item('4', '두부', null, { finished: true }),
      ],
      counts,
    );
    expect(plan).toEqual([
      { id: '1', shelf: 5 },
      { id: '2', shelf: 4 },
    ]);
  });

  it('놓은 자리를 바로 반영해 한 선반이 최대를 넘지 않게 한다', () => {
    // 냉장실 맨 아래(5번)에 29개가 이미 있다. 채소 3개 중 1개만 5번에 들어가고, 나머지는 여유 있는 선반으로
    const full = Array.from({ length: 29 }, (_, i) =>
      item(`f${i}`, '양배추', 5),
    );
    const plan = planAutoPlacement(
      [
        ...full,
        item('a1', '오이', null),
        item('a2', '당근', null),
        item('a3', '대파', null),
      ],
      counts,
    );
    // 5번이 가득(20 이상)이라 추천은 처음부터 가장 여유 있는 선반으로 간다
    expect(plan.every(entry => entry.shelf !== 5)).toBe(true);
    expect(plan).toHaveLength(3);
  });

  it('칸의 모든 선반이 최대면 놓지 않는다', () => {
    const pantryFull = [1, 2].flatMap(shelf =>
      Array.from({ length: 30 }, (_, i) =>
        item(`p${shelf}-${i}`, '라면', shelf, { category: 'pantry' }),
      ),
    );
    const plan = planAutoPlacement(
      [...pantryFull, item('x', '참치캔', null, { category: 'pantry' })],
      counts,
    );
    expect(plan).toEqual([]);
  });
});
