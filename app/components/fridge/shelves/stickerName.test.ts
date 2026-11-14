// app/components/fridge/shelves/stickerName.test.ts

import { describe, expect, it } from 'vitest';
import { stickerName } from './FridgeShelfView';

describe('stickerName', () => {
  it('"…" 없이 5글자까지 자르고, 글자 수와 상관없이 같은 크기로 보인다 (칸에 맞게 누르는 건 화면에서 잰다)', () => {
    const short = stickerName('오이');
    const long = stickerName('방울토마토');
    expect(short.text).toBe('오이');
    expect(long.text).toBe('방울토마토');
    expect(short.className).toBe(long.className);
    expect(stickerName('냉동 닭가슴살').text).toBe('냉동닭가슴');
  });
});
