// app/api/fridges/[id]/notify-level/route.ts
// 이 냉장고의 내 알림 수준 (전체 품목 / 관심 품목만 / 받지 않음)
// 구성원마다 따로 정한다. 다른 구성원의 수준은 바꿀 수 없다

import { NextResponse } from 'next/server';
import { invalidRequest, notFound, requireUser } from '@/app/api/items/guard';
import { setNotifyLevel } from '@/app/lib/notifications/store';
import { FridgeIdSchema } from '@/app/lib/schemas/item';
import { NotifyLevelRequestSchema } from '@/app/lib/schemas/notifications';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, response } = await requireUser();
  if (response) return response;
  const id = FridgeIdSchema.safeParse((await params).id);
  if (!id.success) return notFound();

  const parsed = NotifyLevelRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return invalidRequest(parsed.error);

  if (!(await setNotifyLevel(userId, id.data, parsed.data.level))) {
    return notFound();
  }
  return new NextResponse(null, { status: 204 });
}
