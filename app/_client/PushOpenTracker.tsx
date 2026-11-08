// app/_client/PushOpenTracker.tsx
// 알림을 눌러 앱이 열리면 한 번 기록한다: 우리 DB(문구별 열기 비율)와 GA(열고 나서 무엇을 했는지)

'use client';

import { useEffect } from 'react';
import { track } from '@/app/lib/analytics/gtag';
import {
  readPushOpen,
  withoutPushParams,
} from '@/app/lib/notifications/pushOpen';

export default function PushOpenTracker() {
  useEffect(() => {
    const open = readPushOpen(window.location.search);
    if (!open) return;
    window.history.replaceState(
      window.history.state,
      '',
      withoutPushParams(window.location.pathname, window.location.search),
    );
    // GA 설정(Analytics)이 같은 렌더에서 먼저 끝난 뒤 보내도록 한 박자 미룬다
    setTimeout(
      () =>
        track('notification_opened', {
          kind: open.kind,
          variant: open.variant,
        }),
      0,
    );
    void fetch('/api/notifications/opened', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: open.kind, period: open.period }),
      keepalive: true,
    }).catch(() => {});
  }, []);
  return null;
}
