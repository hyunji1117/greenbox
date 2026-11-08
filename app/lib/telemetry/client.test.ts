// app/lib/telemetry/client.test.ts

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  flushTelemetry,
  pageName,
  reportError,
  reportVital,
  resetTelemetryForTest,
  scrub,
} from './client';

describe('pageName', () => {
  it('홈은 탭 이름, 나머지는 첫 경로만 남긴다 (초대 코드와 검색어는 버린다)', () => {
    expect(pageName('/', '?tab=fridge')).toBe('fridge');
    expect(pageName('/', '')).toBe('home');
    expect(pageName('/join/AbC123xyz', '')).toBe('join');
    expect(pageName('/privacy/2026-11-06', '')).toBe('privacy');
  });
});

describe('scrub', () => {
  it('주소의 검색어를 지우고 길이를 자른다', () => {
    expect(
      scrub('at https://x.app/join/abc?code=SECRET&x=1 (main.js:1:2)', 200),
    ).toBe('at https://x.app/join/abc (main.js:1:2)');
    expect(scrub('a'.repeat(500), 300)).toHaveLength(300);
  });
});

describe('보내기', () => {
  const sendBeacon = vi.fn(() => true);
  const sentBodies = async () =>
    Promise.all(
      sendBeacon.mock.calls.map(call =>
        (call as unknown as [string, Blob])[1].text(),
      ),
    ).then(texts => texts.map(t => JSON.parse(t)));

  beforeEach(() => {
    resetTelemetryForTest();
    sendBeacon.mockClear();
    Object.defineProperty(navigator, 'sendBeacon', {
      value: sendBeacon,
      configurable: true,
    });
    localStorage.clear();
  });
  afterEach(() => vi.unstubAllEnvs());

  it('같은 오류는 한 번만 바로 보낸다', async () => {
    reportError('error', new Error('boom'));
    reportError('error', new Error('boom'));
    expect(sendBeacon).toHaveBeenCalledTimes(1);
    const [body] = await sentBodies();
    expect(body.errors[0]).toMatchObject({ kind: 'error', message: 'boom' });
  });

  it('성능 지표는 모았다가 화면을 떠날 때 보내고, 테스트 기기는 보내지 않는다', async () => {
    reportVital({ name: 'LCP', value: 2294.4, rating: 'good' });
    reportVital({ name: 'CLS', value: 0.08123, rating: 'needs-improvement' });
    expect(sendBeacon).not.toHaveBeenCalled();
    flushTelemetry();
    const [body] = await sentBodies();
    expect(body.vitals.map((v: { value: number }) => v.value)).toEqual([
      2294, 0.081,
    ]);

    localStorage.setItem('greenbox_internal_traffic', '1');
    reportVital({ name: 'LCP', value: 1000, rating: 'good' });
    flushTelemetry();
    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });
});
