// app/api/items/[id]/watch/route.ts
// 관심 품목(종 버튼) 켜기와 끄기. 알림 수준이 "관심 품목만"인 냉장고에서는 이 품목들만 알림이 온다
// 내가 구성원인 냉장고의 품목만 바꿀 수 있고, 다른 구성원의 관심 품목에는 영향이 없다

import { NextResponse } from 'next/server';
import { notFound, requireUser } from '@/app/api/items/guard';
import { setItemWatched } from '@/app/lib/notifications/store';
import { ItemIdSchema } from '@/app/lib/schemas/item';

type Params = { params: Promise<{ id: string }> };

async function setWatched({ params }: Params, watched: boolean) {
  const { userId, response } = await requireUser();
  if (response) return response;
  const id = ItemIdSchema.safeParse((await params).id);
  if (!id.success) return notFound();
  if (!(await setItemWatched(userId, id.data, watched))) return notFound();
  return new NextResponse(null, { status: 204 });
}

export function PUT(_request: Request, context: Params) {
  return setWatched(context, true);
}

export function DELETE(_request: Request, context: Params) {
  return setWatched(context, false);
}
