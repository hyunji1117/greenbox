// app/lib/app/nativeBridge.test.ts

import { afterEach, describe, expect, it, vi } from 'vitest';
import { isInNativeApp, notifyAppReady, shareViaApp } from './nativeBridge';

afterEach(() => {
  delete window.GreenboxApp;
});

describe('nativeBridge', () => {
  it('앱 밖(브라우저)에서는 아무것도 보내지 않고 웹 방식으로 넘긴다', () => {
    expect(isInNativeApp()).toBe(false);
    expect(shareViaApp({ url: 'https://x.test' })).toBe(false);
    expect(() => notifyAppReady()).not.toThrow();
  });

  it('앱 안에서는 공유와 준비 신호를 앱으로 보낸다', () => {
    const post = vi.fn();
    window.GreenboxApp = { platform: 'ios', version: '1.0.0', post };

    expect(isInNativeApp()).toBe(true);
    expect(shareViaApp({ title: '초대', url: 'https://x.test/join/a' })).toBe(
      true,
    );
    notifyAppReady();
    expect(post.mock.calls).toEqual([
      [{ type: 'share', title: '초대', url: 'https://x.test/join/a' }],
      [{ type: 'ready' }],
    ]);
  });
});
