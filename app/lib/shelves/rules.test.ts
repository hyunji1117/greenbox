// app/lib/shelves/rules.test.ts

import { describe, expect, it } from 'vitest';
import { pickStickers, shelfToRemove, STICKERS_PER_SHELF } from './rules';
import { imageForName } from './images';

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

describe('imageForName', () => {
  it('장보기 사진 목록에서 같은 이름이나 다른 이름(달걀/계란)으로 찾고, 없으면 null', () => {
    expect(imageForName('시금치')).toBe('/vege/vege_spinach.jpg');
    expect(imageForName('없는재료이름')).toBeNull();
  });
});
