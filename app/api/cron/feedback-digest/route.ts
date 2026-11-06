// app/api/cron/feedback-digest/route.ts
// 의견 모음 메일. GitHub Actions가 매시간 호출하고, 오전 9시대에 하루 한 번만 보낸다
// CRON_SECRET을 Authorization 헤더로 보내야 한다

import { NextResponse } from 'next/server';
import { runFeedbackDigest } from '@/app/lib/feedback/digest';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (
    !cronSecret ||
    request.headers.get('authorization') !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const result = await runFeedbackDigest();
  // 건수만 남긴다 (의견 내용과 사람 정보 없음)
  console.info('[feedback-digest]', JSON.stringify(result));
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
