// app/lib/shelves/rules.test.ts

import { describe, expect, it } from 'vitest';
import { pickStickers, shelfToRemove, STICKERS_PER_SHELF } from './rules';
import { foodIconFor } from './foodIcons';

describe('shelfToRemove', () => {
  it('아래쪽부터 비어 있는 선반을 고른다', () => {
    expect(shelfToRemove(5, new Set([1, 2, 5]))).toBe(4);
    expect(shelfToRemove(5, new Set([]))).toBe(5);
  });

  it('빈 선반이 없거나 한 층뿐이면 줄일 수 없다', () => {
    expect(shelfToRemove(3, new Set([1, 2, 3]))).toBeNull();
    expect(shelfToRemove(1, new Set([]))).toBeNull();
  });
});

describe('pickStickers', () => {
  it('사진 있는 품목을 먼저, 그다음 유통기한이 가까운 순으로 10개까지 붙이고 나머지 수를 센다', () => {
    const items = Array.from({ length: 13 }, (_, i) => ({
      id: String(i),
      expiryDate: `2026-11-${String(30 - i).padStart(2, '0')}`,
      photo: i % 2 === 0,
    }));
    const { shown, hidden } = pickStickers(items, item => item.photo);
    expect(shown).toHaveLength(STICKERS_PER_SHELF);
    expect(hidden).toBe(3);
    expect(shown.slice(0, 7).every(item => item.photo)).toBe(true);
    expect(shown[0].expiryDate).toBe('2026-11-18');
  });
});

describe('foodIconFor', () => {
  it('이름 안의 가장 긴 재료 이름으로 배경 없는 그림을 찾고, 없으면 null', () => {
    expect(foodIconFor('방울토마토')).toBe('/foods/tomato.png');
    expect(foodIconFor('양배추')).toBe('/foods/leafy_green.png');
    expect(foodIconFor('닭가슴살')).toBe('/foods/chicken.png');
    expect(foodIconFor('달걀')).toBe('/foods/egg.png');
    expect(foodIconFor('케첩')).toBeNull();
  });

  it('직접 만든 한국 식재료와 요리 그림을 찾는다 (된장찌개는 된장보다 길어 요리 그림)', () => {
    expect(foodIconFor('부침두부')).toBe('/foods/tofu.png');
    expect(foodIconFor('애호박')).toBe('/foods/zucchini.png');
    expect(foodIconFor('대파')).toBe('/foods/green_onion.png');
    expect(foodIconFor('느타리버섯')).toBe('/foods/mushroom2.png');
    expect(foodIconFor('된장')).toBe('/foods/doenjang.png');
    expect(foodIconFor('된장찌개')).toBe('/foods/doenjang_stew.png');
  });

  it('남은 음식과 요리 이름은 재료보다 긴 요리 이름을 먼저 따른다', () => {
    expect(foodIconFor('포기김치')).toBe('/foods/kimchi.png');
    expect(foodIconFor('김치찌개')).toBe('/foods/kimchi_stew.png');
    expect(foodIconFor('김치볶음밥')).toBe('/foods/kimchi_fried_rice.png');
    expect(foodIconFor('새우볶음밥')).toBe('/foods/kimchi_fried_rice.png');
    expect(foodIconFor('삼각김밥')).toBe('/foods/samgak_gimbap.png');
    expect(foodIconFor('붕어빵')).toBe('/foods/bungeoppang.png');
    expect(foodIconFor('숙주나물')).toBe('/foods/bean_sprouts.png');
    expect(foodIconFor('비빔국수')).toBe('/foods/bibim_naengmyeon.png');
    expect(foodIconFor('햇반')).toBe('/foods/bap.png');
  });
});
