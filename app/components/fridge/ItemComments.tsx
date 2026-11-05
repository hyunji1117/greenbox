'use client';
// app/components/fridge/ItemComments.tsx
// 품목 댓글 목록과 작성창. 보내자마자 목록에 보이고, 내가 쓴 댓글은 고칠 수 있다
// iOS Safari는 16px 미만 입력창을 누르면 화면을 확대한다. 확대를 막으면서 읽기 쉽게 입력창은 17px로 쓴다

import React, { useEffect, useRef, useState } from 'react';
import { Loader2Icon, SendHorizontalIcon } from 'lucide-react';
import {
  isPendingComment,
  useAddComment,
  useEditComment,
} from '@/app/lib/items/useItems';
import { useCurrentFridge } from '@/app/lib/fridges/useCurrentFridge';
import { COMMENT_TEXT_MAX, type Comment } from '@/app/lib/schemas/item';
import { personLabel } from '@/app/lib/user/displayName';

interface ItemCommentsProps {
  itemId: string;
  comments: Comment[];
  relativeTime: (date: Date) => string;
}

const ItemComments: React.FC<ItemCommentsProps> = ({
  itemId,
  comments,
  relativeTime,
}) => {
  const myUserId = useCurrentFridge().data?.myUserId;
  const addComment = useAddComment();
  const editComment = useEditComment();
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const previousCount = useRef(comments.length);

  // 새 댓글이 붙으면 목록 맨 아래로 내려 방금 쓴 댓글이 바로 보이게 한다
  useEffect(() => {
    if (comments.length > previousCount.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
    previousCount.current = comments.length;
  }, [comments.length]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newComment.trim();
    if (!text) return;
    // 바로 비워서 이어 쓸 수 있게 하고, 실패하면 보낸 내용을 되살려 다시 보낼 수 있게 한다
    setNewComment('');
    addComment.mutate(
      { itemId, input: { text } },
      { onError: () => setNewComment(current => current || text) },
    );
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditDraft(comment.text);
    editComment.reset();
  };

  const saveEdit = (comment: Comment) => {
    const text = editDraft.trim();
    setEditingId(null);
    if (!text || text === comment.text) return;
    editComment.mutate({ itemId, commentId: comment.id, input: { text } });
  };

  return (
    <div className="mt-4">
      <div
        ref={listRef}
        className="max-h-48 space-y-2 overflow-y-auto rounded-xl bg-[#F8F8FB] p-3"
      >
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500">댓글이 없습니다.</p>
        ) : (
          comments.map(comment => {
            const pending = isPendingComment(comment);
            const isMine =
              !pending &&
              myUserId !== undefined &&
              comment.author.id === myUserId;
            if (editingId === comment.id) {
              return (
                <form
                  key={comment.id}
                  onSubmit={e => {
                    e.preventDefault();
                    saveEdit(comment);
                  }}
                  className="space-y-1.5"
                >
                  <input
                    value={editDraft}
                    onChange={e => setEditDraft(e.target.value)}
                    onKeyDown={e => e.key === 'Escape' && setEditingId(null)}
                    maxLength={COMMENT_TEXT_MAX}
                    aria-label="댓글 고치기"
                    autoFocus
                    className="h-10 w-full rounded-lg bg-white px-3 text-[17px] text-gray-800 ring-1 ring-[#A794D6] focus:outline-none"
                  />
                  <div className="flex justify-end gap-1 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="h-8 rounded-lg px-3 text-gray-500 hover:bg-white"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={!editDraft.trim()}
                      className="h-8 rounded-lg bg-[#6B46C1] px-3 text-white disabled:opacity-50"
                    >
                      저장
                    </button>
                  </div>
                </form>
              );
            }
            return (
              <div
                key={comment.id}
                className={pending ? 'opacity-60' : undefined}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {personLabel(comment.author)}
                  </span>
                  <span
                    suppressHydrationWarning
                    className="text-xs text-gray-400"
                  >
                    {pending ? '보내는 중' : relativeTime(comment.createdAt)}
                    {comment.editedAt && ' (수정됨)'}
                  </span>
                  {isMine && (
                    <button
                      type="button"
                      onClick={() => startEdit(comment)}
                      aria-label={`댓글 고치기: ${comment.text}`}
                      className="-my-2 ml-auto h-8 rounded-lg px-2 text-xs font-medium text-gray-500 hover:bg-white"
                    >
                      수정
                    </button>
                  )}
                </div>
                <p className="text-sm break-words whitespace-pre-wrap">
                  {comment.text}
                </p>
              </div>
            );
          })
        )}
      </div>
      {editComment.isError && (
        <p role="alert" className="mt-1 text-xs text-red-500">
          댓글을 고치지 못해 원래대로 되돌렸어요.
        </p>
      )}
      {/* 입력창과 보내기 버튼을 한 칸에 넣어, 폭이 좁아도 둘이 떨어지지 않게 한다 */}
      <form
        onSubmit={handleAdd}
        className="mt-2 flex h-11 items-center gap-1 rounded-xl bg-[#F4F4F8] pr-1 pl-3 focus-within:ring-1 focus-within:ring-[#A794D6]"
      >
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="댓글 추가..."
          maxLength={COMMENT_TEXT_MAX}
          aria-label="댓글 내용"
          enterKeyHint="send"
          className="h-full min-w-0 flex-1 bg-transparent text-[17px] text-gray-800 placeholder:text-gray-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!newComment.trim()}
          aria-label="댓글 보내기"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6B46C1] text-white transition-colors hover:bg-[#603fad] disabled:bg-[#E6DFF7] disabled:text-[#A794D6]"
        >
          {addComment.isPending ? (
            <Loader2Icon size={18} className="motion-safe:animate-spin" />
          ) : (
            <SendHorizontalIcon size={18} />
          )}
        </button>
      </form>
      {addComment.isError && (
        <p role="alert" className="mt-1 text-xs text-red-500">
          댓글을 저장하지 못했어요. 다시 시도해 주세요.
        </p>
      )}
    </div>
  );
};

export default ItemComments;
