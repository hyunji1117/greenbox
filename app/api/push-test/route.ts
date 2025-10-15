import webpush from 'web-push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey =
    process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    console.error('[push-test] Missing VAPID keys in env');
    return new Response(JSON.stringify({ error: 'Missing VAPID keys' }), {
      status: 500,
    });
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);

  const { subscription } = await req.json();

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({ title: '푸시 테스트 성공!' }),
    );
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('[push-test] Push failed:', err);
    return new Response(JSON.stringify({ error: 'Push failed' }), {
      status: 500,
    });
  }
}
