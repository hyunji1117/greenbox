// app/api/fridges/[id]/requests/route.ts
// 승인을 기다리는 참여 요청 목록. 구성원만 볼 수 있다

import { NextResponse } from 'next/server';
import {
  notFound,
  requireFridgeMember,
  requireUser,
} from '@/app/api/items/guard';
import { listPendingRequests } from '@/app/lib/fridges/sharing';
import { FridgeIdSchema } from '@/app/lib/schemas/item';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, response } = await requireUser();
  if (response) return response;
  const id = FridgeIdSchema.safeParse((await params).id);
  if (!id.success) return notFound();
  const member = await requireFridgeMember(userId, id.data);
  if (member.response) return member.response;

  return NextResponse.json(await listPendingRequests(id.data), {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
