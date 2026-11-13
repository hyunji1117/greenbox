// app/api/fridges/[id]/shelves/route.ts
// 선반 보기 베타: 설정 조회(켜짐, 내가 켤 수 있는지, 칸별 선반 수)와 선반 더하기/빼기. 구성원만 할 수 있다
// 선반은 비어 있을 때만 뺀다. 품목이 있는 선반을 빼려 하면 409로 거부해 품목이 사라질 길을 막는다

import { NextResponse } from 'next/server';
import {
  invalidRequest,
  notFound,
  requireFridgeMember,
  requireUser,
} from '@/app/api/items/guard';
import { FridgeIdSchema } from '@/app/lib/schemas/item';
import { ChangeShelfCountSchema } from '@/app/lib/schemas/shelves';
import { changeShelfCount, getShelfSettings } from '@/app/lib/shelves/store';

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
  const { response, userId, fridgeId } = await guard(context);
  if (response) return response;
  return NextResponse.json(await getShelfSettings(fridgeId, userId), {
    headers: NO_STORE,
  });
}

export async function PATCH(request: Request, context: Params) {
  const { response, userId, fridgeId } = await guard(context);
  if (response) return response;
  const parsed = ChangeShelfCountSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return invalidRequest(parsed.error);

  const result = await changeShelfCount(
    fridgeId,
    parsed.data.category,
    parsed.data.action,
  );
  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason === 'max' ? 'shelf_max' : 'shelf_not_empty' },
      { status: 409 },
    );
  }
  return NextResponse.json(await getShelfSettings(fridgeId, userId), {
    headers: NO_STORE,
  });
}
