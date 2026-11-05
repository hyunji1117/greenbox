// app/api/items/recognize/route.ts
// 사진 속 식재료 이름 인식. 로그인하고 방침에 동의한 사용자만 쓸 수 있다
// 사진은 인식에만 쓰고 저장하지 않으며, 돌려준 후보 중 사용자가 고른 것만 따로 저장 요청이 온다

import { NextResponse } from 'next/server';
import { invalidRequest, requireUser } from '@/app/api/items/guard';
import { RecognizeRequestSchema } from '@/app/lib/schemas/recognize';
import { recognizeIngredients } from '@/app/lib/vision/recognizeIngredients';

// 한 사람이 짧은 시간에 너무 많이 보내 사용료가 새지 않게 막는다
// 서버 인스턴스마다 따로 세는 가벼운 제한이라, 여러 인스턴스에 걸친 정확한 제한은 아니다
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 30;
const recent = new Map<string, number[]>();

function isRateLimited(userId: string, now = Date.now()): boolean {
  const times = (recent.get(userId) ?? []).filter(t => now - t < WINDOW_MS);
  if (times.length >= MAX_PER_WINDOW) {
    recent.set(userId, times);
    return true;
  }
  times.push(now);
  recent.set(userId, times);
  return false;
}

export async function POST(request: Request) {
  const { userId, response } = await requireUser();
  if (response) return response;

  const parsed = RecognizeRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return invalidRequest(parsed.error);

  if (isRateLimited(userId)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const result = await recognizeIngredients(
    parsed.data.image,
    parsed.data.mediaType,
  );
  if (result.status === 'unavailable') {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }
  if (result.status === 'failed') {
    return NextResponse.json({ error: 'recognition_failed' }, { status: 502 });
  }
  return NextResponse.json(
    { items: result.items },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
