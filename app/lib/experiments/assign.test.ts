// app/lib/experiments/assign.test.ts

import { describe, expect, it } from 'vitest';
import { hashText, pickVariant } from './assign';
import { assignVariant } from '@/app/lib/notifications/copy';

// 공용 모듈로 옮기기 전(2026-11-13) 알림 문구 A/B가 실제로 쓰던 배정 결과.
// 종류(daily, weekly) x 사람 1~12 x 2026-11-01~10 순서. 바뀌면 진행 중인 실험의 배정이 바뀐 것이다
const FROZEN =
  'ABABABABAABABABABABBABABABABAABABABABABBABABABABAABABABABABBABABABABAABABABABABBABABABABAAABABABABAABABABABABBABABABABAAABABABABAABABABABABBABABABABAABABABABABBABABABABAABABABABABBABABABABAABABABABABBABABABABAAABABABABAABABABABABBABABABABAA';

describe('실험 배정', () => {
  it('알림 문구 A/B 배정은 옮기기 전과 한 건도 다르지 않다', () => {
    let out = '';
    for (const kind of ['daily', 'weekly'] as const) {
      for (let user = 1; user <= 12; user += 1) {
        for (let day = 1; day <= 10; day += 1) {
          const date = `2026-11-${String(day).padStart(2, '0')}`;
          out += assignVariant(String(user), date, kind);
        }
      }
    }
    expect(out).toBe(FROZEN);
  });

  it('같은 단위는 늘 같은 변형을 받고, 변형이 고르게 나뉜다', () => {
    expect(pickVariant('fridge:42', ['list', 'shelf'])).toBe(
      pickVariant('fridge:42', ['list', 'shelf']),
    );
    let shelf = 0;
    for (let id = 1; id <= 1000; id += 1) {
      if (pickVariant(`fridge:${id}`, ['list', 'shelf']) === 'shelf')
        shelf += 1;
    }
    expect(shelf).toBeGreaterThan(450);
    expect(shelf).toBeLessThan(550);
  });

  it('해시는 32비트 양의 정수이고 변형이 없으면 멈춘다', () => {
    expect(hashText('a')).toBeGreaterThanOrEqual(0);
    expect(hashText('a')).toBeLessThan(2 ** 32);
    expect(() => pickVariant('x', [])).toThrow();
  });
});
