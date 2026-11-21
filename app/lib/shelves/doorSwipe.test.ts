import { describe, expect, it } from 'vitest';
import { doorSwipeResult, doorSwipeStart, screenEdgeStart } from './doorSwipe';

describe('doorSwipeStart', () => {
  it('닫혀 있으면 가운데 절반에서만 시작한다', () => {
    expect(doorSwipeStart(180, 360, false)).toBe('center');
    expect(doorSwipeStart(95, 360, false)).toBe('center');
    expect(doorSwipeStart(40, 360, false)).toBeNull();
  });

  it('열려 있으면 왼쪽 절반은 왼쪽 문, 오른쪽 절반은 오른쪽 문에서 시작한다', () => {
    expect(doorSwipeStart(10, 360, true)).toBe('left-edge');
    expect(doorSwipeStart(179, 360, true)).toBe('left-edge');
    expect(doorSwipeStart(180, 360, true)).toBe('right-edge');
    expect(doorSwipeStart(350, 360, true)).toBe('right-edge');
  });
});

describe('screenEdgeStart', () => {
  it('화면 양쪽 끝 24px 안에서 시작한 손길만 받는다', () => {
    expect(screenEdgeStart(0, 390)).toBe('left-edge');
    expect(screenEdgeStart(24, 390)).toBe('left-edge');
    expect(screenEdgeStart(25, 390)).toBeNull();
    expect(screenEdgeStart(366, 390)).toBe('right-edge');
    expect(screenEdgeStart(389, 390)).toBe('right-edge');
    expect(screenEdgeStart(10, 0)).toBeNull();
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
