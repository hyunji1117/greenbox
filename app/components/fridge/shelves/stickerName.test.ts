// app/components/fridge/shelves/stickerName.test.ts

import { describe, expect, it } from 'vitest';
import { stickerName } from './FridgeShelfView';

describe('stickerName', () => {
  it('"…" 없이 5글자까지 보이고, 길수록 글자를 좁혀 칸 안에 맞춘다', () => {
    expect(stickerName('오이')).toMatchObject({ text: '오이', scaleX: 1 });
    expect(stickerName('파프리카')).toMatchObject({
      text: '파프리카',
      className: 'text-[9px] tracking-[-0.06em]',
      scaleX: 1,
    });
    expect(stickerName('방울토마토')).toMatchObject({
      text: '방울토마토',
      scaleX: 0.8,
    });
    expect(stickerName('냉동 닭가슴살')).toMatchObject({ text: '냉동닭가슴' });
  });
});
