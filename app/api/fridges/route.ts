// app/api/fridges/route.ts
// 내가 속한 냉장고 목록 (냉장고 전환 화면)

import { NextResponse } from 'next/server';
import { requireUser } from '@/app/api/items/guard';
import { listMyFridges } from '@/app/lib/fridges/sharing';

export async function GET() {
  const { userId, response } = await requireUser();
  if (response) return response;

  return NextResponse.json(await listMyFridges(userId), {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
