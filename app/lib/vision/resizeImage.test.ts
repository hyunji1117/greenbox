// app/lib/vision/resizeImage.test.ts

import { describe, expect, it } from 'vitest';
import { fitWithin, MAX_IMAGE_EDGE } from './resizeImage';

describe('fitWithin', () => {
  it('긴 쪽을 1568px에 맞춰 비율대로 줄인다', () => {
    expect(fitWithin(4032, 3024)).toEqual({
      width: MAX_IMAGE_EDGE,
      height: 1176,
    });
    expect(fitWithin(3024, 4032)).toEqual({
      width: 1176,
      height: MAX_IMAGE_EDGE,
    });
  });

  it('이미 작은 사진은 키우지 않는다', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
});
