// app/lib/notifications/pushOpen.test.ts

import { describe, expect, it } from 'vitest';
import { readPushOpen, withoutPushParams } from './pushOpen';

describe('readPushOpen', () => {
  it('알림에서 열린 주소만 읽는다', () => {
    expect(
      readPushOpen('?tab=fridge&from=push&kind=daily&v=B&d=2026-11-09'),
    ).toEqual({ kind: 'daily', variant: 'B', period: '2026-11-09' });
    expect(readPushOpen('?tab=fridge')).toBeNull();
  });

  it('형식이 맞지 않으면 기록하지 않는다', () => {
    expect(readPushOpen('?from=push&kind=monthly&v=A&d=2026-11-09')).toBeNull();
    expect(readPushOpen('?from=push&kind=daily&v=<x>&d=2026-11-09')).toBeNull();
    expect(readPushOpen('?from=push&kind=daily&v=A&d=yesterday')).toBeNull();
  });
});

describe('withoutPushParams', () => {
  it('알림 표시만 지우고 탭은 남긴다', () => {
    expect(
      withoutPushParams(
        '/',
        '?tab=fridge&from=push&kind=daily&v=B&d=2026-11-09',
      ),
    ).toBe('/?tab=fridge');
    expect(
      withoutPushParams('/', '?from=push&kind=daily&v=B&d=2026-11-09'),
    ).toBe('/');
  });
});
