// app/components/common/MarqueeText.test.tsx

import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MarqueeText, { marqueeDuration } from './MarqueeText';

// jsdom은 레이아웃을 계산하지 않으므로 글자 폭과 상자 폭을 직접 정한다
function mockWidths(textWidth: number, boxWidth: number) {
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(
    textWidth,
  );
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(
    boxWidth,
  );
}

describe('MarqueeText', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('한 줄에 들어가면 움직이지 않고 그대로 보여 준다', () => {
    mockWidths(100, 200);
    render(<MarqueeText text="새우" />);
    const text = screen.getByText('새우');
    expect(text.className).not.toContain('animate-marquee');
    expect(text.parentElement?.dataset.overflowing).toBeUndefined();
  });

  it('넘치면 말줄임표 대신 넘친 만큼 흘리고, 움직임 줄이기면 두 줄로 보여 준다', () => {
    mockWidths(360, 200);
    render(<MarqueeText text="냉장고에 ‘냉동 새우와 칵테일 새우’가 없어요" />);
    const text = screen.getByText(/칵테일 새우/);
    expect(text.className).toContain('motion-safe:animate-marquee');
    expect(text.className).toContain('motion-reduce:line-clamp-2');
    expect(text.className).not.toContain('truncate');
    expect(text.style.getPropertyValue('--marquee-distance')).toBe('-160px');
  });

  it('흐르는 시간은 넘친 거리에 비례하되 최소 5초다', () => {
    expect(marqueeDuration(20)).toBe(5);
    expect(marqueeDuration(240)).toBe(10);
  });
});
