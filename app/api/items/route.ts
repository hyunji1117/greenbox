// app/api/items/route.ts
// 내 품목 목록 조회와 등록

import { NextResponse } from 'next/server';
import { createItem, listItems } from '@/app/lib/items/store';
import { CreateItemSchema } from '@/app/lib/schemas/item';
import { invalidRequest, requireUser } from './guard';

const NO_STORE = { 'Cache-Control': 'private, no-store' };

export async function GET() {
  const { userId, response } = await requireUser();
  if (response) return response;

  const items = await listItems(userId);
  return NextResponse.json(items, { headers: NO_STORE });
}

export async function POST(request: Request) {
  const { userId, response } = await requireUser();
  if (response) return response;

  // 본문이 JSON이 아니어도 스키마 검증에서 400으로 처리한다
  const body = await request.json().catch(() => null);
  const parsed = CreateItemSchema.safeParse(body);
  if (!parsed.success) return invalidRequest(parsed.error);

  const item = await createItem(userId, parsed.data);
  return NextResponse.json(item, { status: 201, headers: NO_STORE });
}
