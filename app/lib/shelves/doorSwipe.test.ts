import { describe, expect, it } from 'vitest';
import { doorSwipeResult, doorSwipeStart } from './doorSwipe';

describe('doorSwipeStart', () => {
  it('닫혀 있으면 가운데 절반에서만 시작한다', () => {
    expect(doorSwipeStart(180, 360, false)).toBe('center');
    expect(doorSwipeStart(95, 360, false)).toBe('center');
    expect(doorSwipeStart(40, 360, false)).toBeNull();
  });

  it('열려 있으면 양쪽 끝 쪽(폭의 35%, 최소 48px)에서만 시작한다', () => {
    expect(doorSwipeStart(120, 360, true)).toBe('left-edge');
    expect(doorSwipeStart(240, 360, true)).toBe('right-edge');
    expect(doorSwipeStart(180, 360, true)).toBeNull();
    expect(doorSwipeStart(40, 100, true)).toBe('left-edge');
  });
});

describe('doorSwipeResult', () => {
  it('가운데에서 어느 쪽으로든 60px 이상 밀면 연다', () => {
    expect(doorSwipeResult('center', 70, 5)).toBe('open');
    expect(doorSwipeResult('center', -70, 5)).toBe('open');
    expect(doorSwipeResult('center', 40, 0)).toBeNull();
  });

  it('끝 띠에서 안쪽으로 밀 때만 닫는다', () => {
    expect(doorSwipeResult('left-edge', 80, 0)).toBe('close');
    expect(doorSwipeResult('right-edge', -80, 0)).toBe('close');
    expect(doorSwipeResult('left-edge', -80, 0)).toBeNull();
  });

  it('세로로 더 움직였으면 스크롤로 보고 무시한다', () => {
    expect(doorSwipeResult('center', 70, 80)).toBeNull();
    expect(doorSwipeResult(null, 200, 0)).toBeNull();
  });
});
