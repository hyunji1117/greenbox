// app/api/feedback/route.ts
// 의견 보내기. 로그인하고 방침에 동의한 사용자가 보낼 때 따로 동의한 경우에만 저장한다
// 보낸 사람은 요청 본문이 아니라 로그인 사용자로 기록한다

import { NextResponse } from 'next/server';
import { invalidRequest, requireUser } from '@/app/api/items/guard';
import { saveFeedback } from '@/app/lib/feedback/store';
import { CreateFeedbackSchema } from '@/app/lib/schemas/feedback';

// 한 사람이 짧은 시간에 너무 많이 보내지 않게 막는다 (서버 인스턴스마다 따로 세는 가벼운 제한)
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 10;
const recent = new Map<string, number[]>();

function isRateLimited(userId: string, now = Date.now()): boolean {
  const times = (recent.get(userId) ?? []).filter(t => now - t < WINDOW_MS);
  const limited = times.length >= MAX_PER_WINDOW;
  if (!limited) times.push(now);
  recent.set(userId, times);
  return limited;
}

export async function POST(request: Request) {
  const { userId, response } = await requireUser();
  if (response) return response;

  const parsed = CreateFeedbackSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return invalidRequest(parsed.error);
  if (isRateLimited(userId)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  await saveFeedback(userId, parsed.data);
  return new NextResponse(null, { status: 201 });
}
