// app/privacy/PolicyBackButton.test.ts

import { describe, expect, it } from 'vitest';
import { backTarget } from './PolicyBackButton';

const origin = 'https://greenbox.example';

describe('backTarget', () => {
  it('앱 화면의 링크로 넘어왔으면 보던 화면으로 돌아간다', () => {
    expect(
      backTarget({ initialPath: '/', referrer: '', origin, historyLength: 3 }),
    ).toBe('back');
  });

  it('같은 사이트에서 주소를 새로 열어 왔으면 돌아간다', () => {
    expect(
      backTarget({
        initialPath: '/privacy',
        referrer: `${origin}/login`,
        origin,
        historyLength: 2,
      }),
    ).toBe('back');
  });

  it('새 탭으로 열었거나 바깥 사이트에서 왔으면 첫 화면으로 간다', () => {
    const direct = { initialPath: '/privacy', origin };
    expect(
      backTarget({
        ...direct,
        referrer: `${origin}/consent`,
        historyLength: 1,
      }),
    ).toBe('home');
    expect(
      backTarget({
        ...direct,
        referrer: 'https://www.google.com/',
        historyLength: 4,
      }),
    ).toBe('home');
    expect(backTarget({ ...direct, referrer: '', historyLength: 2 })).toBe(
      'home',
    );
  });
});
