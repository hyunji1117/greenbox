// app/lib/analytics/gtag.test.ts

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  INTERNAL_FLAG_KEY,
  initAnalytics,
  resetAnalyticsForTest,
  resolveTrafficParams,
  setInternalDevice,
  track,
  trackPageView,
} from './gtag';

const commands = () =>
  (window.dataLayer ?? []).map(args => Array.from(args as ArrayLike<unknown>));

describe('resolveTrafficParams', () => {
  beforeEach(() => localStorage.clear());

  it('표시하지 않은 기기는 일반 트래픽으로 보낸다', () => {
    expect(resolveTrafficParams('', localStorage, false)).toEqual({});
  });

  it('?internal=on으로 표시하면 다음 방문에도 개발자 트래픽으로 보낸다', () => {
    resolveTrafficParams('?internal=on', localStorage, false);
    expect(localStorage.getItem(INTERNAL_FLAG_KEY)).toBe('1');
    expect(resolveTrafficParams('', localStorage, false)).toEqual({
      debug_mode: true,
    });
  });

  it('?internal=off로 표시를 지운다', () => {
    localStorage.setItem(INTERNAL_FLAG_KEY, '1');
    expect(resolveTrafficParams('?internal=off', localStorage, false)).toEqual(
      {},
    );
  });

  it('개발 환경은 표시가 없어도 개발자 트래픽으로 보내고 내부 트래픽 표시는 붙이지 않는다', () => {
    expect(resolveTrafficParams('', null, true)).toEqual({ debug_mode: true });
  });

  it('저장소를 쓸 수 없어도 오류 없이 일반 트래픽으로 보낸다', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {},
      removeItem: () => {},
    };
    expect(resolveTrafficParams('', blocked, false)).toEqual({});
  });
});

describe('track', () => {
  beforeEach(() => {
    resetAnalyticsForTest();
    window.dataLayer = [];
    localStorage.clear();
  });
  afterEach(() => {
    delete window.dataLayer;
  });

  it('설정 전에는 이벤트를 쌓지 않는다', () => {
    track('comment_added');
    trackPageView('http://localhost/');
    expect(commands()).toEqual([]);
  });

  it('설정 명령 뒤에 이벤트가 순서대로 쌓인다', () => {
    initAnalytics('G-TEST');
    trackPageView('http://localhost/?tab=fridge');
    track('item_added', { source: 'fridge_quick_add', count: 1 });

    const names = commands().map(c => `${c[0]}:${String(c[1])}`);
    expect(names[0]).toMatch(/^js:/);
    expect(names.slice(-3)).toEqual([
      'config:G-TEST',
      'event:page_view',
      'event:item_added',
    ]);
    expect(commands().at(-3)?.[2]).toEqual({ send_page_view: false });
    expect(commands().at(-1)?.[2]).toEqual({
      source: 'fridge_quick_add',
      count: 1,
    });
  });

  it('앱을 연 뒤 테스트 기기로 표시해도 다음 이벤트부터 개발자 트래픽으로 보낸다', () => {
    initAnalytics('G-TEST');
    track('comment_added');
    setInternalDevice(true);
    track('comment_added');
    trackPageView('http://localhost/');

    expect(commands().at(-3)?.[2]).toEqual({});
    expect(commands().at(-2)?.[2]).toEqual({ debug_mode: true });
    expect(commands().at(-1)?.[2]).toMatchObject({ debug_mode: true });
  });

  it('여러 번 불러도 설정은 한 번만 보낸다', () => {
    initAnalytics('G-TEST');
    initAnalytics('G-TEST');
    expect(commands().filter(c => c[0] === 'config')).toHaveLength(1);
  });
});
