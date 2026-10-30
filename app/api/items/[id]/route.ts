// app/api/items/[id]/route.ts
// 내 품목 수정과 소진 처리

import { NextResponse } from 'next/server';
import { updateItem } from '@/app/lib/items/store';
import { ItemIdSchema, UpdateItemSchema } from '@/app/lib/schemas/item';
import { invalidRequest, requireUser } from '../guard';

const notFound = () =>
  NextResponse.json({ error: 'not_found' }, { status: 404 });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, response } = await requireUser();
  if (response) return response;

  const id = ItemIdSchema.safeParse((await params).id);
  if (!id.success) return notFound();

  const body = await request.json().catch(() => null);
  const parsed = UpdateItemSchema.safeParse(body);
  if (!parsed.success) return invalidRequest(parsed.error);

  // 남의 품목도 없는 품목과 똑같이 404로 답해 존재 여부를 알리지 않는다
  const item = await updateItem(userId, id.data, parsed.data);
  if (!item) return notFound();
  return NextResponse.json(item, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
