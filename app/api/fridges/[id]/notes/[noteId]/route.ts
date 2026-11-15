// app/api/fridges/[id]/notes/[noteId]/route.ts
// 가족 게시판 메모 하나: 확인(줄 긋기)과 확인 풀기, 지우기. 가족 누구나 할 수 있다
// 지우기는 확인된 메모만 된다 (확인 전 메모를 실수로 지우지 않게. 화면도 확인된 메모에만 지우기를 둔다)

import { NextResponse } from 'next/server';
import { invalidRequest, notFound } from '@/app/api/items/guard';
import { deleteCheckedNote, setNoteChecked } from '@/app/lib/notes/store';
import { CheckNoteSchema } from '@/app/lib/schemas/notes';
import { boardGuard } from '../guard';

type Params = { params: Promise<{ id: string; noteId: string }> };

const noteIdOf = async (params: Params['params']) => {
  const { noteId } = await params;
  return /^\d{1,18}$/.test(noteId) ? noteId : null;
};

export async function PATCH(request: Request, { params }: Params) {
  const { response, userId, fridgeId } = await boardGuard(params);
  if (response) return response;
  const noteId = await noteIdOf(params);
  if (!noteId) return notFound();
  const parsed = CheckNoteSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) return invalidRequest(parsed.error);
  const note = await setNoteChecked(
    fridgeId,
    noteId,
    userId,
    parsed.data.checked,
  );
  return note
    ? NextResponse.json(note, {
        headers: { 'Cache-Control': 'private, no-store' },
      })
    : notFound();
}

export async function DELETE(_request: Request, { params }: Params) {
  const { response, fridgeId } = await boardGuard(params);
  if (response) return response;
  const noteId = await noteIdOf(params);
  if (!noteId) return notFound();
  return (await deleteCheckedNote(fridgeId, noteId))
    ? new NextResponse(null, { status: 204 })
    : NextResponse.json({ error: 'not_checked' }, { status: 409 });
}
