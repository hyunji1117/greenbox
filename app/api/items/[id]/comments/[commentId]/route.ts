// app/api/items/[id]/comments/[commentId]/route.ts
// 댓글 내용 고치기. 내가 쓴 댓글이고 지금도 그 냉장고 구성원일 때만 고칠 수 있다

import { NextResponse } from 'next/server';
import { updateComment } from '@/app/lib/items/store';
import {
  CommentIdSchema,
  ItemIdSchema,
  UpdateCommentSchema,
} from '@/app/lib/schemas/item';
import { invalidRequest, notFound, requireUser } from '../../../guard';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const { userId, response } = await requireUser();
  if (response) return response;

  const { id, commentId } = await params;
  const itemId = ItemIdSchema.safeParse(id);
  const parsedCommentId = CommentIdSchema.safeParse(commentId);
  if (!itemId.success || !parsedCommentId.success) return notFound();

  const body = await request.json().catch(() => null);
  const parsed = UpdateCommentSchema.safeParse(body);
  if (!parsed.success) return invalidRequest(parsed.error);

  // 남의 댓글이나 다른 냉장고의 댓글은 있는지조차 알리지 않는다
  const comment = await updateComment(
    userId,
    itemId.data,
    parsedCommentId.data,
    parsed.data,
  );
  if (!comment) return notFound();
  return NextResponse.json(comment, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
