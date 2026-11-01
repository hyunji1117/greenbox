// app/lib/push/subscribe.ts
// 브라우저 푸시 구독을 현재 키로 맞추고 서버에 저장한다

import { isSameKey, urlBase64ToUint8Array } from '@/app/lib/push/key';

export type PushStatus = 'unsupported' | NotificationPermission;

export function getPushStatus(): PushStatus {
  if (
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    return 'unsupported';
  }
  return Notification.permission;
}

// 저장까지 끝나면 true. 로그인 전이면 저장이 거절되어 false
export async function syncPushSubscription(): Promise<boolean> {
  // next-pwa가 등록한 서비스워커(sw.js)를 사용
  // (여기서 별도 등록하면 같은 scope의 precache SW를 대체함)
  const reg = await navigator.serviceWorker.ready;

  const res = await fetch('/api/public-vapid-key');
  const { publicKey } = await res.json();
  const key = urlBase64ToUint8Array(publicKey);

  // 현재 키로 구독되어 있으면 재사용. 로그인 전에 구독했을 수 있어 저장은 다시 한다
  let sub = await reg.pushManager.getSubscription();
  if (!sub || !isSameKey(sub.options.applicationServerKey, key)) {
    // 키가 바뀐 구독은 그대로 쓸 수 없고, 해제해야 새 키로 구독할 수 있다
    await sub?.unsubscribe();
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key,
    });
  }

  const saved = await fetch('/api/save-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub),
  });
  return saved.ok;
}

// iOS는 사용자가 누른 동작 안에서만 권한을 물을 수 있어 버튼에서 호출한다
export async function enablePush(): Promise<PushStatus> {
  const permission = await Notification.requestPermission();
  if (permission === 'granted' && !(await syncPushSubscription())) {
    throw new Error('구독을 저장하지 못했습니다');
  }
  return permission;
}
