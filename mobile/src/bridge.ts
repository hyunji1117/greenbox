// src/bridge.ts
// 앱과 웹 사이 메시지 규약
// - 앱 → 웹: 화면이 그려지기 전에 window.GreenboxApp(플랫폼, 앱 버전, post 함수)을 심는다
// - 웹 → 앱: window.GreenboxApp.post({ type, ... }) 로 보내면 앱이 받아 네이티브 기능을 실행한다

import { APP_VERSION, PLATFORM } from './config';

export const INJECTED_BEFORE_LOAD = `
(function () {
  window.GreenboxApp = {
    platform: ${JSON.stringify(PLATFORM)},
    version: ${JSON.stringify(APP_VERSION)},
    post: function (message) {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    },
  };
})();
true;
`;

export type WebMessage =
  // 공유 시트 열기 (웹뷰에서는 navigator.share가 안 되는 기기가 있다)
  | { type: 'share'; title?: string; text?: string; url?: string }
  // 웹뷰가 아니라 브라우저로 열 주소
  | { type: 'open-external'; url: string }
  // 웹이 앱 안에서 다 그려졌다는 신호 (첫 화면 로딩 표시를 닫는다)
  | { type: 'ready' };

// 웹이 보낸 글자를 알려진 메시지로만 받아들인다
export function parseWebMessage(data: string): WebMessage | null {
  try {
    const message = JSON.parse(data) as { type?: unknown } & Record<string, unknown>;
    switch (message.type) {
      case 'share':
        return {
          type: 'share',
          title: typeof message.title === 'string' ? message.title : undefined,
          text: typeof message.text === 'string' ? message.text : undefined,
          url: typeof message.url === 'string' ? message.url : undefined,
        };
      case 'open-external':
        return typeof message.url === 'string' && /^https?:\/\//.test(message.url)
          ? { type: 'open-external', url: message.url }
          : null;
      case 'ready':
        return { type: 'ready' };
      default:
        return null;
    }
  } catch {
    return null;
  }
}
