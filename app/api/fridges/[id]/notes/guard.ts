// app/api/fridges/[id]/notes/guard.ts
// 게시판 요청 공통 확인: 로그인, 냉장고 구성원, 선반 보기 베타가 켜진 냉장고인지
// 구성원이 아니거나 게시판이 없는 냉장고는 있는지도 알리지 않도록 404

import {
  notFound,
  requireFridgeMember,
  requireUser,
} from '@/app/api/items/guard';
import { isBoardEnabled } from '@/app/lib/notes/store';
import { FridgeIdSchema } from '@/app/lib/schemas/item';

export async function boardGuard(params: Promise<{ id: string }>) {
  const { userId, response } = await requireUser();
  if (response) return { response };
  const id = FridgeIdSchema.safeParse((await params).id);
  if (!id.success) return { response: notFound() };
  const member = await requireFridgeMember(userId, id.data);
  if (member.response) return { response: member.response };
  if (!(await isBoardEnabled(id.data))) return { response: notFound() };
  return { userId, fridgeId: id.data };
}
