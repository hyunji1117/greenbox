// app/api/cron/expiry-notifications/route.ts
// 매일 한 번 Vercel Cron이 호출한다. Vercel이 CRON_SECRET을 Authorization 헤더로 보낸다

import { NextResponse } from 'next/server';
import { sendExpiryNotifications } from '@/app/lib/push/sendExpiryNotifications';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (
    !cronSecret ||
    request.headers.get('authorization') !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return NextResponse.json(await sendExpiryNotifications());
}
