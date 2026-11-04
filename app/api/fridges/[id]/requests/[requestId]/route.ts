// app/api/fridges/[id]/requests/[requestId]/route.ts
// 참여 요청 승인 또는 거절. 기존 구성원 누구나 할 수 있다
// 승인되면 요청한 사람과 다른 구성원에게 알린다

import { NextResponse } from 'next/server';
import {
  invalidRequest,
  notFound,
  requireFridgeMember,
  requireUser,
} from '@/app/api/items/guard';
import {
  decideRequest,
  getNamesForNotice,
  listOtherMemberIds,
} from '@/app/lib/fridges/sharing';
import { sendPushToUsers } from '@/app/lib/push/sendToUsers';
import { withObjectParticle } from '@/app/lib/user/displayName';
import { DecisionSchema } from '@/app/lib/schemas/fridge';
import { FridgeIdSchema, ItemIdSchema } from '@/app/lib/schemas/item';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> },
) {
  const { userId, response } = await requireUser();
  if (response) return response;
  const { id, requestId } = await params;
  const fridgeId = FridgeIdSchema.safeParse(id);
  const reqId = ItemIdSchema.safeParse(requestId);
  if (!fridgeId.success || !reqId.success) return notFound();
  const member = await requireFridgeMember(userId, fridgeId.data);
  if (member.response) return member.response;

  const parsed = DecisionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return invalidRequest(parsed.error);

  const result = await decideRequest(
    userId,
    fridgeId.data,
    reqId.data,
    parsed.data.decision === 'approve',
  );
  // 이미 처리됐거나 만료된 요청
  if (result.status === 'not_found') return notFound();
  // 요청한 사람이 그사이 다른 냉장고에 들어가 최대 개수가 된 경우
  if (result.status === 'limit') {
    return NextResponse.json({ error: 'fridge_limit' }, { status: 409 });
  }

  if (result.status === 'approved') {
    const { fridgeName, userName } = await getNamesForNotice(
      fridgeId.data,
      result.requesterId,
    );
    const others = (
      await listOtherMemberIds(fridgeId.data, result.requesterId)
    ).filter(other => other !== userId);
    await Promise.all([
      sendPushToUsers([result.requesterId], {
        title: '참여가 승인됐어요',
        body: `이제 ${withObjectParticle(fridgeName)} 함께 볼 수 있어요`,
      }),
      sendPushToUsers(others, {
        title: '함께 보는 사람이 늘었어요',
        body: `${userName}님이 ${fridgeName}에 들어왔어요`,
      }),
    ]);
  }
  return NextResponse.json({ status: result.status });
}
