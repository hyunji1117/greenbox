// app/api/join/[code]/route.ts
// 초대 링크로 참여 요청과 내 요청 상태 확인. 기존 구성원이 승인해야 들어간다
// 요청이 새로 생기면 구성원에게 알린다

import { NextResponse } from 'next/server';
import { requireUser } from '@/app/api/items/guard';
import {
  getMyJoinStatus,
  getNamesForNotice,
  listOtherMemberIds,
  requestToJoin,
} from '@/app/lib/fridges/sharing';
import { sendPushToUsers } from '@/app/lib/push/sendToUsers';
import { withObjectParticle } from '@/app/lib/user/displayName';

// 요청한 사람이 승인을 기다리는 동안 내 상태 확인 (member / pending / none)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { userId, response } = await requireUser();
  if (response) return response;

  const result = await getMyJoinStatus(userId, (await params).code);
  if (!result) {
    return NextResponse.json({ error: 'invalid_invite' }, { status: 404 });
  }
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { userId, response } = await requireUser();
  if (response) return response;

  const result = await requestToJoin(userId, (await params).code);
  if (result.status === 'invalid') {
    return NextResponse.json({ error: 'invalid_invite' }, { status: 404 });
  }
  if (result.status === 'limit') {
    return NextResponse.json({ error: 'fridge_limit' }, { status: 409 });
  }

  if (result.status === 'pending' && result.created) {
    const { fridgeName, userName } = await getNamesForNotice(
      result.fridgeId,
      userId,
    );
    await sendPushToUsers(await listOtherMemberIds(result.fridgeId, userId), {
      title: '참여 요청이 왔어요',
      body: `${userName}님이 ${withObjectParticle(fridgeName)} 함께 보고 싶어 해요`,
    });
  }
  return NextResponse.json({ status: result.status });
}
