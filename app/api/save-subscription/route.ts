// app/api/save-subscription/route.ts
// 서버 푸시를 보낼 기기 정보 저장

import { NextResponse } from 'next/server';
import { invalidRequest, requireUser } from '@/app/api/items/guard';
import { savePushSubscription } from '@/app/lib/push/store';
import { PushSubscriptionSchema } from '@/app/lib/schemas/pushSubscription';

export async function POST(request: Request) {
  const { userId, response } = await requireUser();
  if (response) return response;

  // 본문이 JSON이 아니어도 스키마 검증에서 400으로 처리한다
  const body = await request.json().catch(() => null);
  const parsed = PushSubscriptionSchema.safeParse(body);
  if (!parsed.success) return invalidRequest(parsed.error);

  await savePushSubscription(userId, parsed.data);
  return new NextResponse(null, { status: 204 });
}
