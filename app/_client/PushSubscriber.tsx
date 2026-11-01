// app/_client/PushSubscriber.tsx
// 이미 알림을 허용한 기기의 구독을 페이지를 열 때 맞춘다. 권한 요청은 마이 탭의 버튼에서 한다

'use client';

import { useEffect } from 'react';
import { getPushStatus, syncPushSubscription } from '@/app/lib/push/subscribe';

export default function PushSubscriber() {
  useEffect(() => {
    if (getPushStatus() !== 'granted') return;
    syncPushSubscription().catch(e => {
      console.error('푸시 구독 실패:', e);
    });
  }, []);

  // 화면 출력 없음
  return null;
}
