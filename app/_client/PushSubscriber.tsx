// app/_client/PushSubscriber.tsx
// PWA 푸시 알림 구독 컴포넌트

'use client';

import { useEffect } from 'react';

function urlBase64ToUint8Array(base64String: string) {
  // URL-safe base64 → Uint8Array 변환
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw =
    typeof window !== 'undefined'
      ? window.atob(base64)
      : Buffer.from(base64, 'base64').toString('binary');
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) output[i] = raw.charCodeAt(i);
  return output;
}

export default function PushSubscriber() {
  useEffect(() => {
    (async () => {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window))
          return;

        // 서비스워커 등록
        const reg =
          await navigator.serviceWorker.register('/service-worker.js');

        // 알림 권한 요청
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // 이미 구독되어 있으면 재사용
        const existing = await reg.pushManager.getSubscription();
        if (existing) return;

        // 새 구독
        // const res = await fetch('/api/public-vapid-key');
        const res = await fetch('/api/public-vapid-key');
        // 서버에서 env 값 전달
        const { publicKey } = await res.json();
        const key = urlBase64ToUint8Array(publicKey);
        console.log('VAPID length:', key.length); // 기대 65

        const state = await reg.pushManager.permissionState({
          userVisibleOnly: true,
          applicationServerKey: key,
        });
        console.log('push permissionState:', state); // 'granted' | 'prompt' | 'denied'

        const sub = await reg.pushManager
          .subscribe({ userVisibleOnly: true, applicationServerKey: key })
          .catch(err => {
            console.error('subscribe 실패:', err.name, err.message);
            throw err;
          });

        console.log('구독 성공:', sub?.endpoint); // 여기가 찍히면 성공

        // 서버에서 env 값 전달
        // const { publicKey } = await res.json();
        // const key = urlBase64ToUint8Array(publicKey);
        // console.log('VAPID public key length:', key.length, publicKey);

        // 서버에 구독 정보 저장
        await fetch('/api/save-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(key),
        });
      } catch (e) {
        console.error('푸시 구독 실패:', e);
      }
    })();
  }, []);

  // 화면 출력 없음
  return null;
}
