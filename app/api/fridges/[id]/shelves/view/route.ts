// app/api/fridges/[id]/shelves/view/route.ts
// 선반 보기 베타 켜기/끄기. 냉장고 주인이면서 실험 허용 목록에 있는 사람만 바꿀 수 있다
// 켜면 같은 냉장고 가족 모두에게 선반 보기가 보이고, 끄면 바로 목록으로 돌아온다 (선반 자리는 남는다)

import { NextResponse } from 'next/server';
import {
  invalidRequest,
  notFound,
  requireFridgeMember,
  requireUser,
} from '@/app/api/items/guard';
import { FridgeIdSchema } from '@/app/lib/schemas/item';
import { SetShelfViewSchema } from '@/app/lib/schemas/shelves';
import { getShelfSettings, setShelfView } from '@/app/lib/shelves/store';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, response } = await requireUser();
  if (response) return response;
  const id = FridgeIdSchema.safeParse((await params).id);
  if (!id.success) return notFound();
  const member = await requireFridgeMember(userId, id.data);
  if (member.response) return member.response;

  const parsed = SetShelfViewSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return invalidRequest(parsed.error);

  const changed = await setShelfView(id.data, userId, parsed.data.enabled);
  if (!changed) {
    return NextResponse.json({ error: 'not_allowed' }, { status: 403 });
  }
  return NextResponse.json(await getShelfSettings(id.data, userId), {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
