// app/api/notifications/opened/route.ts
// 요약 알림을 눌러 앱을 열었을 때 그 알림에 연 시각을 남긴다 (알림 문구 A/B 비교용)
// 로그인 사용자 본인이 받은 알림에만 남긴다. 이미 남겼으면 그대로 둔다

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { invalidRequest, requireUser } from '@/app/api/items/guard';
import { markSummaryOpened } from '@/app/lib/notifications/store';

const OpenedSchema = z.object({
  kind: z.enum(['daily', 'weekly']),
  period: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: Request) {
  const { userId, response } = await requireUser();
  if (response) return response;
  const parsed = OpenedSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return invalidRequest(parsed.error);
  const marked = await markSummaryOpened(
    userId,
    parsed.data.kind,
    parsed.data.period,
  );
  return NextResponse.json({ marked });
}
