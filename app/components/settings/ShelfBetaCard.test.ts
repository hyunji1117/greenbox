// app/components/settings/ShelfBetaCard.test.ts

import { describe, expect, it } from 'vitest';
import { lastChangeText } from './ShelfBetaCard';

describe('lastChangeText', () => {
  it('마지막으로 바꾼 사람과 날짜, 켰는지 껐는지를 알려 준다', () => {
    const at = new Date(2026, 10, 15, 10, 0);
    expect(lastChangeText({ name: '엄마', enabled: true, at })).toBe(
      '엄마가 11월 15일에 켰어요',
    );
    expect(lastChangeText({ name: '현준', enabled: false, at })).toBe(
      '현준이 11월 15일에 껐어요',
    );
    expect(lastChangeText({ name: null, enabled: true, at })).toBe(
      '가족이 11월 15일에 켰어요',
    );
  });
});
