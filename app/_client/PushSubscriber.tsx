// app/_client/PushSubscriber.tsx
// PWA 푸시 알림 구독 컴포넌트

'use client';

import { useEffect } from 'react';
import { isSameKey, urlBase64ToUint8Array } from '@/app/lib/push/key';

function saveSubscription(sub: PushSubscription) {
  return fetch('/api/save-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub),
  });
}

export default function PushSubscriber() {
  useEffect(() => {
    (async () => {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window))
          return;

        // next-pwa가 등록한 서비스워커(sw.js)를 사용
        // (여기서 별도 등록하면 같은 scope의 precache SW를 대체함)
        const reg = await navigator.serviceWorker.ready;

        // 알림 권한 요청
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // 서버에서 env 값 전달
        const res = await fetch('/api/public-vapid-key');
        const { publicKey } = await res.json();
        const key = urlBase64ToUint8Array(publicKey);

        // 현재 키로 구독되어 있으면 재사용. 로그인 전에 구독했을 수 있어 저장은 다시 한다
        const existing = await reg.pushManager.getSubscription();
        if (existing && isSameKey(existing.options.applicationServerKey, key)) {
          await saveSubscription(existing);
          return;
        }

        // 키가 바뀐 구독은 그대로 쓸 수 없고, 해제해야 새 키로 구독할 수 있다
        await existing?.unsubscribe();

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        });

        // 서버에 구독 정보 저장
        await saveSubscription(sub);
      } catch (e) {
        console.error('푸시 구독 실패:', e);
      }
    })();
  }, []);

  // 화면 출력 없음
  return null;
}
