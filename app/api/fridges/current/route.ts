// app/api/fridges/current/route.ts
// 지금 보고 있는 냉장고와 구성원 조회, 다른 냉장고로 전환
// 품목 화면은 이 냉장고 번호로 품목을 불러온다

import { NextResponse } from 'next/server';
import { invalidRequest, notFound, requireUser } from '@/app/api/items/guard';
import { switchCurrentFridge } from '@/app/lib/fridges/sharing';
import { getCurrentFridge } from '@/app/lib/fridges/store';
import { SwitchFridgeSchema } from '@/app/lib/schemas/fridge';
import { FridgeIdSchema } from '@/app/lib/schemas/item';

const NO_STORE = { 'Cache-Control': 'private, no-store' };

// keep: 지금 화면에 보이는 냉장고. 아직 구성원이면 그 냉장고를 그대로 돌려준다
export async function GET(request: Request) {
  const { userId, response } = await requireUser();
  if (response) return response;

  const keep = FridgeIdSchema.safeParse(
    new URL(request.url).searchParams.get('keep'),
  );
  return NextResponse.json(
    await getCurrentFridge(userId, keep.success ? keep.data : undefined),
    { headers: NO_STORE },
  );
}

// 구성원인 냉장고로만 바꿀 수 있다
export async function PUT(request: Request) {
  const { userId, response } = await requireUser();
  if (response) return response;

  const parsed = SwitchFridgeSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return invalidRequest(parsed.error);

  if (!(await switchCurrentFridge(userId, parsed.data.fridgeId))) {
    return notFound();
  }
  return NextResponse.json(await getCurrentFridge(userId), {
    headers: NO_STORE,
  });
}
