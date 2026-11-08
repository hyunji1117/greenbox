// app/lib/telemetry/userAgent.test.ts

import { describe, expect, it } from 'vitest';
import { browserOf, deviceOf } from './userAgent';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const MAC_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36';
const SAMSUNG =
  'Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36';

describe('userAgent', () => {
  it('기기 종류와 브라우저 이름만 뽑는다', () => {
    expect([deviceOf(IPHONE_SAFARI), browserOf(IPHONE_SAFARI)]).toEqual([
      'mobile',
      'safari',
    ]);
    expect([deviceOf(MAC_CHROME), browserOf(MAC_CHROME)]).toEqual([
      'desktop',
      'chrome',
    ]);
    expect(browserOf(SAMSUNG)).toBe('samsung');
  });
});
