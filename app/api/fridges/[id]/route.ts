// app/api/fridges/[id]/route.ts
// 냉장고 이름 바꾸기
// 만든 사람은 냉장고 이름을 바꾸고, 함께 보는 사람은 자기 화면에서만 보이는 이름을 바꾼다
// 화면을 거치지 않은 요청이어도 함께 보는 사람이 냉장고 이름 자체를 바꿀 수는 없다

import { NextResponse } from 'next/server';
import {
  invalidRequest,
  notFound,
  requireUser,
} from '@/app/api/items/guard';
import { renameFridge } from '@/app/lib/fridges/sharing';
import { FridgeNameSchema, toFridgeName } from '@/app/lib/schemas/fridge';
import { FridgeIdSchema } from '@/app/lib/schemas/item';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, response } = await requireUser();
  if (response) return response;
  const id = FridgeIdSchema.safeParse((await params).id);
  if (!id.success) return notFound();

  const parsed = FridgeNameSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return invalidRequest(parsed.error);

  // 저장되는 이름은 항상 "앞 이름 냉장고" 형식. 구성원이 아니면 바뀌는 것이 없다
  const scope = await renameFridge(
    userId,
    id.data,
    toFridgeName(parsed.data.label),
  );
  if (!scope) return notFound();
  return new NextResponse(null, { status: 204 });
}
