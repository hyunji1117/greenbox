// app/api/push-test/route.ts
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:you@example.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function POST() {
  // TODO: DB에서 방금 저장한 구독 정보(sub) 로드
  const sub = /* {endpoint, keys: { p256dh, auth } } */;

  try {
    await webpush.sendNotification(
      sub,
      JSON.stringify({ title: '테스트 푸시', body: '우리집 냉장고에서 보냄' }) // ≤ 4KB
    );
    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? 'send fail' }, { status: 500 });
  }
}
