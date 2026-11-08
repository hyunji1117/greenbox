// app/lib/recipes/today.test.ts

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ItemJson } from '@/app/lib/items/store';
import {
  isRecipeAvailable,
  pickIngredients,
  recipeCacheKey,
  toRecipeJson,
} from './today';

const item = (
  id: string,
  name: string,
  expiryDate: string | null,
  finished = false,
) =>
  ({
    id,
    name,
    category: 'fridge',
    quantity: 1,
    eatenQuantity: 0,
    addedBy: { id: '1', name: 'A', isMember: true },
    addedAt: '2026-11-01T00:00:00.000Z',
    comments: [],
    finished,
    expiryDate,
    watched: false,
  }) as ItemJson;

// 2026-11-08 KST
const NOW = new Date('2026-11-08T03:00:00Z');

describe('pickIngredients', () => {
  it('유통기한 3일 안(지난 것 포함)을 급한 순으로 이름이 겹치지 않게 3개까지 고르고 나머지는 다른 재료로 둔다', () => {
    const { soon, otherNames } = pickIngredients(
      [
        item('1', '두부', '2026-11-10'),
        item('2', '시금치', '2026-11-07'),
        item('3', '우유', '2026-11-20'),
        item('4', '달걀', '2026-11-09'),
        item('5', '연어', '2026-11-11'),
        item('6', '김치', null),
        item('7', '버섯', '2026-11-08', true),
        item('8', '두부', '2026-11-09'),
      ],
      NOW,
    );
    expect(soon.map(i => i.id)).toEqual(['2', '4', '8']);
    // 같은 이름(두부)은 한 번만, 남은 두부는 다른 재료에 들어간다
    expect(otherNames).toEqual(['두부', '우유', '연어', '김치']);
  });
});

describe('recipeCacheKey', () => {
  it('재료 순서와 중복에 상관없이 같은 열쇠를 만든다', () => {
    expect(recipeCacheKey(['두부', '시금치'])).toBe(
      recipeCacheKey(['시금치', '두부', '두부']),
    );
  });
});

describe('toRecipeJson', () => {
  it('있음과 살 것을 지금 냉장고와 양념 기준으로 다시 정하고, 쓰는 곧 먹어야 할 품목을 알려 준다', () => {
    const json = toRecipeJson(
      {
        id: '9',
        title: '두부 시금치 무침',
        minutes: 10,
        caution: null,
        steps: [{ text: '데친다' }],
        ingredients: [
          { name: '두부', amount: '1모', have: true },
          { name: '시금치', amount: '한 줌', have: true },
          { name: '진간장', amount: '1큰술', have: false },
          { name: '대파', amount: '1대', have: true },
          { name: '콩나물', amount: '한 줌', have: false },
        ],
      },
      ['두부', '시금치'],
      [item('1', '두부', '2026-11-10')],
    );
    expect(json.ingredients.map(i => [i.name, i.have])).toEqual([
      ['두부', true],
      ['시금치', true],
      ['진간장', true],
      ['대파', false],
      ['콩나물', false],
    ]);
    expect(json.usedItemIds).toEqual(['1']);
  });
});

describe('isRecipeAvailable', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('방침 시행 전에는 지정한 사람에게만 열고, 켜면 모두에게 연다', () => {
    vi.stubEnv('RECIPE_PREVIEW_USER_IDS', '1, 7');
    vi.stubEnv('RECIPES_ENABLED', '');
    expect(isRecipeAvailable('7')).toBe(true);
    expect(isRecipeAvailable('2')).toBe(false);
    vi.stubEnv('RECIPES_ENABLED', 'true');
    expect(isRecipeAvailable('2')).toBe(true);
  });
});
