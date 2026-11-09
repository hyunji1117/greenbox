// app/lib/app/nativeBridge.ts
// 모바일 앱(웹뷰) 안에서 열렸는지 알고, 앱에 메시지를 보낸다
// 앱이 화면을 그리기 전에 window.GreenboxApp을 심는다 (mobile/src/bridge.ts와 같은 규약)

export interface GreenboxAppBridge {
  platform: 'ios' | 'android';
  version: string;
  post: (message: unknown) => void;
}

declare global {
  interface Window {
    GreenboxApp?: GreenboxAppBridge;
  }
}

export function nativeApp(): GreenboxAppBridge | null {
  if (typeof window === 'undefined') return null;
  return window.GreenboxApp ?? null;
}

export const isInNativeApp = () => nativeApp() !== null;

// 앱이면 앱의 공유 시트로 보낸다. 앱이 아니면 false (웹의 navigator.share를 쓴다)
export function shareViaApp(data: {
  title?: string;
  text?: string;
  url?: string;
}): boolean {
  const app = nativeApp();
  if (!app) return false;
  app.post({ type: 'share', ...data });
  return true;
}

// 첫 화면이 그려졌다고 앱에 알려 로딩 표시를 닫게 한다
export function notifyAppReady(): void {
  nativeApp()?.post({ type: 'ready' });
}
