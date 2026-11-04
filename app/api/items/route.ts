// app/api/items/route.ts
// 냉장고 품목 목록 조회와 등록. 어느 냉장고인지는 요청마다 밝히고, 서버가 구성원인지 확인한다

import { NextResponse } from 'next/server';
import { createItem, listItems } from '@/app/lib/items/store';
import {
  CreateItemRequestSchema,
  FridgeIdSchema,
} from '@/app/lib/schemas/item';
import {
  invalidRequest,
  notFound,
  requireFridgeMember,
  requireUser,
} from './guard';

const NO_STORE = { 'Cache-Control': 'private, no-store' };

export async function GET(request: Request) {
  const { userId, response } = await requireUser();
  if (response) return response;

  const fridgeId = FridgeIdSchema.safeParse(
    new URL(request.url).searchParams.get('fridgeId'),
  );
  if (!fridgeId.success) return notFound();
  const member = await requireFridgeMember(userId, fridgeId.data);
  if (member.response) return member.response;

  const items = await listItems(fridgeId.data);
  return NextResponse.json(items, { headers: NO_STORE });
}

export async function POST(request: Request) {
  const { userId, response } = await requireUser();
  if (response) return response;

  // 본문이 JSON이 아니어도 스키마 검증에서 400으로 처리한다
  const body = await request.json().catch(() => null);
  const parsed = CreateItemRequestSchema.safeParse(body);
  if (!parsed.success) return invalidRequest(parsed.error);

  const { fridgeId, ...input } = parsed.data;
  const member = await requireFridgeMember(userId, fridgeId);
  if (member.response) return member.response;

  const item = await createItem(fridgeId, userId, input);
  return NextResponse.json(item, { status: 201, headers: NO_STORE });
}
