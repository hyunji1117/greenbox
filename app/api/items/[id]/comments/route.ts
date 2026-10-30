// app/api/items/[id]/comments/route.ts
// 내 품목에 댓글 추가

import { NextResponse } from 'next/server';
import { addComment } from '@/app/lib/items/store';
import { CreateCommentSchema, ItemIdSchema } from '@/app/lib/schemas/item';
import { invalidRequest, requireUser } from '../../guard';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, response } = await requireUser();
  if (response) return response;

  const id = ItemIdSchema.safeParse((await params).id);
  if (!id.success) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateCommentSchema.safeParse(body);
  if (!parsed.success) return invalidRequest(parsed.error);

  const comment = await addComment(userId, id.data, parsed.data);
  if (!comment) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json(comment, {
    status: 201,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
