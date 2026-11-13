// app/api/items/route.ts
// 냉장고 품목 목록 조회와 등록. 어느 냉장고인지는 요청마다 밝히고, 서버가 구성원인지 확인한다

import { NextResponse } from 'next/server';
import { recommendedExpiryDate } from '@/app/lib/items/storageGuide';
import { koreaClock } from '@/app/lib/notifications/schedule';
import { createItem, listItems } from '@/app/lib/items/store';
import { shelfSlotState } from '@/app/lib/shelves/store';
import {
  CreateItemRequestSchema,
  FridgeIdSchema,
} from '@/app/lib/schemas/item';
import {
  invalidRequest,
  notFound,
  requireFridgeMember,
  shelfConflict,
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

  const items = await listItems(fridgeId.data, userId);
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

  // 유통기한을 비워 두면 권장 보관 기간으로 채운다 (직접 넣은 날짜가 우선, 나중에 고칠 수 있음)
  const expiryDate =
    input.expiryDate ??
    recommendedExpiryDate(
      input.name,
      input.category,
      koreaClock(new Date()).date,
    );
  // 선반 보기에서 넣을 때: 그 선반이 있고 가득 차지 않았을 때만 놓는다
  if (input.shelf !== undefined) {
    const slot = await shelfSlotState(fridgeId, input.category, input.shelf);
    if (slot !== 'ok') return shelfConflict(slot);
  }
  const item = await createItem(fridgeId, userId, { ...input, expiryDate });
  return NextResponse.json(item, { status: 201, headers: NO_STORE });
}
