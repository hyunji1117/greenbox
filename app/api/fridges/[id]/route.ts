// app/api/fridges/[id]/route.ts
// 냉장고 이름 바꾸기. 구성원 누구나 바꿀 수 있다 (예: 자취방 냉장고, 본가 냉장고)

import { NextResponse } from 'next/server';
import {
  invalidRequest,
  notFound,
  requireFridgeMember,
  requireUser,
} from '@/app/api/items/guard';
import { renameFridge } from '@/app/lib/fridges/sharing';
import { FridgeNameSchema } from '@/app/lib/schemas/fridge';
import { FridgeIdSchema } from '@/app/lib/schemas/item';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, response } = await requireUser();
  if (response) return response;
  const id = FridgeIdSchema.safeParse((await params).id);
  if (!id.success) return notFound();
  const member = await requireFridgeMember(userId, id.data);
  if (member.response) return member.response;

  const parsed = FridgeNameSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return invalidRequest(parsed.error);

  await renameFridge(id.data, parsed.data.name);
  return new NextResponse(null, { status: 204 });
}
