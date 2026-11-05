// app/api/me/notifications/route.ts
// 내 알림 설정 (켜기/끄기, 하루 요약 시각, 주간 요약 요일과 시각)
// 가족마다 생활 시간이 달라 사람마다 따로 정한다

import { NextResponse } from 'next/server';
import { invalidRequest, requireUser } from '@/app/api/items/guard';
import {
  getNotificationSettings,
  saveNotificationSettings,
} from '@/app/lib/notifications/store';
import { UpdateNotificationSettingsSchema } from '@/app/lib/schemas/notifications';

const NO_STORE = { 'Cache-Control': 'private, no-store' };

export async function GET() {
  const { userId, response } = await requireUser();
  if (response) return response;
  return NextResponse.json(await getNotificationSettings(userId), {
    headers: NO_STORE,
  });
}

export async function PATCH(request: Request) {
  const { userId, response } = await requireUser();
  if (response) return response;
  const parsed = UpdateNotificationSettingsSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return invalidRequest(parsed.error);
  const settings = await saveNotificationSettings(userId, parsed.data);
  return NextResponse.json({ settings, saved: true }, { headers: NO_STORE });
}
