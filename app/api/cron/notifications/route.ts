// app/api/cron/notifications/route.ts
// 요약 알림 발송. GitHub Actions가 매시간, Vercel Cron이 하루 한 번(예비) 호출한다
// 둘 다 CRON_SECRET을 Authorization 헤더로 보낸다. 발송 기록으로 중복 발송은 막는다

import { NextResponse } from 'next/server';
import { sendDueSummaries } from '@/app/lib/notifications/sendSummaries';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (
    !cronSecret ||
    request.headers.get('authorization') !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const result = await sendDueSummaries();
  // 실행마다 한 줄로 남겨 Vercel 로그에서도 발송 결과와 지연을 볼 수 있게 한다 (사람 정보 없음)
  console.info('[notifications]', JSON.stringify(result));
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
