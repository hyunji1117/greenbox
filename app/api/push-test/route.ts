// app/api/push-test/route.ts
// 푸시 알림 테스트용 API 라우트

import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:you@example.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function POST() {
  // TODO: DB에서 방금 저장한 구독 정보(sub) 로드
  const sub = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/example-endpoint',
    keys: {
      p256dh: 'example-p256dh-key',
      auth: 'example-auth-key',
    },
  };

  try {
    await webpush.sendNotification(
      sub,
      JSON.stringify({ title: '테스트 푸시', body: '우리집 냉장고에서 보냄' }), // ≤ 4KB
    );
    return Response.json({ ok: true });
  } catch (e: unknown) {
    if (e instanceof Error) {
      return Response.json({ error: e.message }, { status: 500 });
    }
    return Response.json({ error: 'Unknown error occurred' }, { status: 500 });
  }
}
