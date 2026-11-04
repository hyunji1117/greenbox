// app/api/items/[id]/comments/route.ts
// 품목에 댓글 추가. 내가 구성원인 냉장고의 품목에만 남길 수 있고, 작성자는 로그인 사용자로 기록한다

import { NextResponse } from 'next/server';
import { addComment } from '@/app/lib/items/store';
import { CreateCommentSchema, ItemIdSchema } from '@/app/lib/schemas/item';
import { invalidRequest, notFound, requireUser } from '../../guard';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, response } = await requireUser();
  if (response) return response;

  const id = ItemIdSchema.safeParse((await params).id);
  if (!id.success) return notFound();

  const body = await request.json().catch(() => null);
  const parsed = CreateCommentSchema.safeParse(body);
  if (!parsed.success) return invalidRequest(parsed.error);

  const comment = await addComment(userId, id.data, parsed.data);
  if (!comment) return notFound();
  return NextResponse.json(comment, {
    status: 201,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
