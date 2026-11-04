// app/api/fridges/[id]/invite/route.ts
// 초대 링크 조회, 새로 만들기, 끄기. 구성원만 할 수 있다
// 링크로 들어온 사람도 기존 구성원이 승인해야 냉장고 안을 볼 수 있다

import { NextResponse } from 'next/server';
import {
  notFound,
  requireFridgeMember,
  requireUser,
} from '@/app/api/items/guard';
import {
  createInvite,
  getActiveInvite,
  revokeInvites,
} from '@/app/lib/fridges/sharing';
import { FridgeIdSchema } from '@/app/lib/schemas/item';

const NO_STORE = { 'Cache-Control': 'private, no-store' };
type Params = { params: Promise<{ id: string }> };

async function guard({ params }: Params) {
  const { userId, response } = await requireUser();
  if (response) return { response };
  const id = FridgeIdSchema.safeParse((await params).id);
  if (!id.success) return { response: notFound() };
  const member = await requireFridgeMember(userId, id.data);
  if (member.response) return { response: member.response };
  return { userId, fridgeId: id.data };
}

export async function GET(_request: Request, context: Params) {
  const { response, fridgeId } = await guard(context);
  if (response) return response;
  return NextResponse.json(await getActiveInvite(fridgeId), {
    headers: NO_STORE,
  });
}

export async function POST(_request: Request, context: Params) {
  const { response, userId, fridgeId } = await guard(context);
  if (response) return response;
  return NextResponse.json(await createInvite(userId, fridgeId), {
    status: 201,
    headers: NO_STORE,
  });
}

export async function DELETE(_request: Request, context: Params) {
  const { response, fridgeId } = await guard(context);
  if (response) return response;
  await revokeInvites(fridgeId);
  return new NextResponse(null, { status: 204 });
}
