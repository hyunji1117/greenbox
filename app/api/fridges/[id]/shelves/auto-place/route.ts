// app/api/fridges/[id]/shelves/auto-place/route.ts
// 선반 보기 정식 전환: 선반 없이 들어가 있던 품목을 추천 자리에 놓는다 (docs/decisions/0012-shelf-view-beta.md)
// 선반 보기가 켜진 냉장고에서 화면이 선반 없는 품목을 발견하면 한 번 부른다. 구성원 누구나 부를 수 있고,
// 이미 놓인 품목은 건드리지 않아 여러 번 불러도 결과가 같다. 놓은 품목은 "앱이 놓음"(auto_placed_at)으로 남겨
// 사람이 확인하게 한다

import { NextResponse } from 'next/server';
import {
  notFound,
  requireFridgeMember,
  requireUser,
} from '@/app/api/items/guard';
import { listItems } from '@/app/lib/items/store';
import { FridgeIdSchema, ItemListSchema } from '@/app/lib/schemas/item';
import { planAutoPlacement } from '@/app/lib/shelves/autoPlace';
import { applyAutoPlacement, getShelfSettings } from '@/app/lib/shelves/store';

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const { userId, response } = await requireUser();
  if (response) return response;
  const id = FridgeIdSchema.safeParse((await params).id);
  if (!id.success) return notFound();
  const member = await requireFridgeMember(userId, id.data);
  if (member.response) return member.response;

  const settings = await getShelfSettings(id.data, userId);
  if (!settings.enabled) {
    return NextResponse.json({ error: 'shelf_view_off' }, { status: 409 });
  }
  // 화면이 받는 모양(ItemSchema)으로 읽어 화면과 같은 추천 규칙을 쓴다
  const items = ItemListSchema.parse(await listItems(id.data, userId));
  const plan = planAutoPlacement(items, settings.counts);
  const placed = await applyAutoPlacement(id.data, plan);
  return NextResponse.json({ placed });
}
