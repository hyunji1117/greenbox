// app/lib/push/key.test.ts

import { describe, expect, it } from 'vitest';
import { isSameKey, urlBase64ToUint8Array } from './key';

const buffer = (...bytes: number[]) => new Uint8Array(bytes).buffer;

describe('urlBase64ToUint8Array', () => {
  it('패딩 없는 URL-safe base64를 바이트로 바꾼다', () => {
    expect([...urlBase64ToUint8Array('-_8')]).toEqual([251, 255]);
  });
});

describe('isSameKey', () => {
  const current = new Uint8Array([4, 1, 2]);

  it('내용이 같으면 같은 키다', () => {
    expect(isSameKey(buffer(4, 1, 2), current)).toBe(true);
  });

  it.each([
    ['내용이 다른 키', buffer(4, 1, 3)],
    ['길이가 다른 키', buffer(4, 1)],
    ['키 정보가 없는 구독', null],
  ])('%s는 다른 키로 본다', (_, subscribed) => {
    expect(isSameKey(subscribed, current)).toBe(false);
  });
});
