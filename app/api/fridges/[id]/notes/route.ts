// app/api/fridges/[id]/notes/route.ts
// 가족 게시판: 메모 목록과 새 메모. 구성원만 쓸 수 있고, 선반 보기 베타가 켜진 냉장고에서만 연다
// 새 메모는 다른 가족에게 알린다 (알림을 끈 사람 빼고, 같은 냉장고에서 5분 안에 이어 쓴 메모는 한 번만)

import { NextResponse } from 'next/server';
import { invalidRequest } from '@/app/api/items/guard';
import { getNamesForNotice } from '@/app/lib/fridges/sharing';
import {
  claimNoteRecipients,
  createNote,
  listNotes,
} from '@/app/lib/notes/store';
import { sendPushToUsers } from '@/app/lib/push/sendToUsers';
import { CreateNoteSchema } from '@/app/lib/schemas/notes';
import { boardGuard } from './guard';

const NO_STORE = { 'Cache-Control': 'private, no-store' };
type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { response, fridgeId } = await boardGuard(params);
  if (response) return response;
  return NextResponse.json(await listNotes(fridgeId), { headers: NO_STORE });
}

export async function POST(request: Request, { params }: Params) {
  const { response, userId, fridgeId } = await boardGuard(params);
  if (response) return response;
  const parsed = CreateNoteSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return invalidRequest(parsed.error);

  const note = await createNote(fridgeId, userId, parsed.data.text);
  if (note === 'full') {
    return NextResponse.json({ error: 'board_full' }, { status: 409 });
  }

  // 알림이 실패해도 메모는 남았으므로 응답은 그대로 보낸다
  try {
    const recipients = await claimNoteRecipients(fridgeId, userId);
    if (recipients.length > 0) {
      const { fridgeName, userName } = await getNamesForNotice(
        fridgeId,
        userId,
      );
      await sendPushToUsers(recipients, {
        title: `${fridgeName} 게시판`,
        body: `${userName}: ${note.text}`,
        url: '/?tab=fridge',
      });
    }
  } catch (error) {
    console.error('[notes] 알림 실패', error);
  }
  return NextResponse.json(note, { status: 201, headers: NO_STORE });
}
