// app/api/fridges/current/route.ts
// 지금 보고 있는 냉장고와 구성원. 품목 화면은 이 냉장고 번호로 품목을 불러온다

import { NextResponse } from 'next/server';
import { requireUser } from '@/app/api/items/guard';
import { getCurrentFridge } from '@/app/lib/fridges/store';

export async function GET() {
  const { userId, response } = await requireUser();
  if (response) return response;

  const fridge = await getCurrentFridge(userId);
  return NextResponse.json(fridge, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
