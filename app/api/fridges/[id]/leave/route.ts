// app/api/fridges/[id]/leave/route.ts
// 냉장고에서 나가기. 내가 넣은 품목과 댓글은 냉장고에 남는다

import { NextResponse } from 'next/server';
import { notFound, requireUser } from '@/app/api/items/guard';
import { leaveFridge } from '@/app/lib/fridges/sharing';
import { FridgeIdSchema } from '@/app/lib/schemas/item';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, response } = await requireUser();
  if (response) return response;
  const fridgeId = FridgeIdSchema.safeParse((await params).id);
  if (!fridgeId.success) return notFound();

  const result = await leaveFridge(userId, fridgeId.data);
  if (result.status === 'not_member') return notFound();
  // 혼자 쓰는 냉장고에서 나가면 품목을 볼 사람이 없어진다
  if (result.status === 'alone') {
    return NextResponse.json({ error: 'last_member' }, { status: 409 });
  }
  return NextResponse.json({ currentFridgeId: result.currentFridgeId });
}
