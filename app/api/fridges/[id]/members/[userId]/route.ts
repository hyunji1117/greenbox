// app/api/fridges/[id]/members/[userId]/route.ts
// 구성원 내보내기. 냉장고를 만든 사람만 할 수 있고, 내보낸 사람은 즉시 접근할 수 없다

import { NextResponse } from 'next/server';
import {
  notFound,
  requireFridgeMember,
  requireUser,
} from '@/app/api/items/guard';
import { removeMember } from '@/app/lib/fridges/sharing';
import { FridgeIdSchema, ItemIdSchema } from '@/app/lib/schemas/item';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const session = await requireUser();
  if (session.response) return session.response;
  const { id, userId: target } = await params;
  const fridgeId = FridgeIdSchema.safeParse(id);
  const targetId = ItemIdSchema.safeParse(target);
  if (!fridgeId.success || !targetId.success) return notFound();

  const member = await requireFridgeMember(session.userId, fridgeId.data);
  if (member.response) return member.response;
  if (member.role !== 'owner') {
    return NextResponse.json({ error: 'owner_only' }, { status: 403 });
  }

  const result = await removeMember(fridgeId.data, targetId.data);
  if (result === 'not_found') return notFound();
  // 만든 사람 자신은 내보낼 수 없다 (나가기를 쓴다)
  if (result === 'owner') {
    return NextResponse.json({ error: 'cannot_remove_owner' }, { status: 409 });
  }
  return new NextResponse(null, { status: 204 });
}
