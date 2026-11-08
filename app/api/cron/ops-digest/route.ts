// app/api/cron/ops-digest/route.ts
// 운영 지표 메일. GitHub Actions가 매시간 호출하고, 오전 9시대에 하루 한 번만 보낸다
// CRON_SECRET을 Authorization 헤더로 보내야 한다. ?now=1이면 시각과 상관없이 지금 보낸다 (하루 한 번은 그대로)

import { NextResponse } from 'next/server';
import { runOpsDigest } from '@/app/lib/telemetry/digest';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (
    !cronSecret ||
    request.headers.get('authorization') !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const sendNow = new URL(request.url).searchParams.get('now') === '1';
  const result = await runOpsDigest(undefined, undefined, { sendNow });
  console.info('[ops-digest]', JSON.stringify(result));
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
