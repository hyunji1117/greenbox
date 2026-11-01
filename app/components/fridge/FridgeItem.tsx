// app/components/fridge/FridgeItem.tsx
// 냉장고 아이템 컴포넌트

import React, { useState } from 'react';
import { useFridge } from '@/app/context/FridgeContext';
import { useAddComment, useUpdateItem } from '@/app/lib/items/useItems';
import type { FinishKind } from '@/app/lib/items/useFinishWithUndo';
import {
  daysUntilExpiry,
  EXPIRY_SOON_DAYS,
  expiryLabel,
  isSavableExpiryDate,
} from '@/app/lib/items/expiry';
import { COMMENT_TEXT_MAX, QUANTITY_MAX } from '@/app/lib/schemas/item';
import {
  CircleCheckBig,
  MessageCircleIcon,
  MinusIcon,
  PlusIcon,
  Trash2,
} from 'lucide-react';
interface FridgeItemProps {
  item: {
    id: string;
    name: string;
    category: 'fridge' | 'freezer' | 'pantry';
    quantity: number;
    addedBy: string;
    addedAt: Date;
    comments: Array<{
      id: string;
      text: string;
      author: string;
      createdAt: Date;
    }>;
    finished: boolean;
    expiryDate?: string;
  };
  isNew?: boolean;
  onFinish: (kind: FinishKind) => void;
}
const FridgeItem: React.FC<FridgeItemProps> = ({
  item,
  isNew = false,
  onFinish,
}) => {
  const { currentUser, getFamilyMemberName } = useFridge();
  const updateItem = useUpdateItem(item.id);
  const addComment = useAddComment();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  // 날짜를 입력하는 도중의 값. 저장 전이거나 저장에 실패하면 서버 값과 다를 수 있다
  const [expiryDraft, setExpiryDraft] = useState<string | null>(null);
  const expiryDays =
    item.expiryDate === undefined ? null : daysUntilExpiry(item.expiryDate);
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && !addComment.isPending) {
      // 실패하면 입력한 내용을 지우지 않아 다시 보낼 수 있다
      addComment.mutate(
        {
          itemId: item.id,
          input: { text: newComment, author: currentUser },
        },
        { onSuccess: () => setNewComment('') },
      );
    }
  };
  const incrementQuantity = () => {
    if (item.quantity < QUANTITY_MAX) {
      updateItem.mutate({
        id: item.id,
        updates: { quantity: item.quantity + 1 },
      });
    }
  };
  const decrementQuantity = () => {
    if (item.quantity > 1) {
      updateItem.mutate({
        id: item.id,
        updates: { quantity: item.quantity - 1 },
      });
    }
  };
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const expiryDate = e.target.value;
    setExpiryDraft(expiryDate);
    if (isSavableExpiryDate(expiryDate) && expiryDate !== item.expiryDate) {
      updateItem.mutate(
        { id: item.id, updates: { expiryDate } },
        { onError: () => setExpiryDraft(null) },
      );
    }
  };
  const getRelativeTimeString = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor(
      (now.getTime() - new Date(date).getTime()) / 1000,
    );
    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    return `${Math.floor(diffInSeconds / 86400)}일 전`;
  };
  return (
    <article
      className={`rounded-2xl bg-white p-4 text-gray-800 shadow-[0_4px_20px_rgba(75,47,140,0.07)] ring-1 ring-black/5 ${isNew ? 'motion-safe:animate-item-added' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg leading-snug font-semibold">{item.name}</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {getFamilyMemberName(item.addedBy)}가{' '}
            {getRelativeTimeString(item.addedAt)} 추가
          </p>
        </div>
        {expiryDays !== null && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              expiryDays <= EXPIRY_SOON_DAYS
                ? 'bg-red-50 text-red-600'
                : 'bg-[#F1EDFA] text-[#553C9A]'
            }`}
          >
            {expiryLabel(expiryDays)}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <label className="min-w-0 flex-1 text-xs font-medium text-gray-500">
          유통기한
          <input
            type="date"
            value={expiryDraft ?? item.expiryDate ?? ''}
            onChange={handleExpiryChange}
            onBlur={() => setExpiryDraft(null)}
            className="mt-1 block h-10 w-full min-w-0 rounded-xl bg-[#F4F4F8] px-2 text-base font-normal text-gray-700 focus:ring-1 focus:ring-[#A794D6] focus:outline-none"
          />
        </label>
        <div className="flex h-10 shrink-0 items-center rounded-xl bg-[#F4F4F8] text-gray-700">
          <button
            type="button"
            onClick={decrementQuantity}
            aria-label={`${item.name} 수량 줄이기`}
            disabled={item.quantity <= 1}
            className="flex h-10 w-9 items-center justify-center rounded-l-xl transition-colors hover:bg-gray-200 disabled:opacity-30"
          >
            <MinusIcon size={16} />
          </button>
          <span
            aria-label={`수량 ${item.quantity}`}
            className="min-w-6 text-center text-sm font-semibold"
          >
            {item.quantity}
          </span>
          <button
            type="button"
            onClick={incrementQuantity}
            aria-label={`${item.name} 수량 늘리기`}
            disabled={item.quantity >= QUANTITY_MAX}
            className="flex h-10 w-9 items-center justify-center rounded-r-xl transition-colors hover:bg-gray-200 disabled:opacity-30"
          >
            <PlusIcon size={16} />
          </button>
        </div>
      </div>
      <div className="mt-3 -mb-3 grid grid-cols-3 gap-1 border-t border-gray-100 pt-2 text-xs font-medium text-gray-600">
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          aria-expanded={showComments}
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl transition-colors hover:bg-gray-100"
        >
          <MessageCircleIcon size={18} />
          댓글{item.comments.length > 0 && ` ${item.comments.length}`}
        </button>
        <button
          type="button"
          onClick={() => onFinish('eaten')}
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl transition-colors hover:bg-gray-100"
        >
          <CircleCheckBig size={18} />다 먹음
        </button>
        <button
          type="button"
          onClick={() => onFinish('discarded')}
          className="flex h-11 items-center justify-center gap-1.5 rounded-xl transition-colors hover:bg-gray-100"
        >
          <Trash2 size={18} />
          버림
        </button>
      </div>
      {updateItem.isError && (
        <p className="mt-2 text-xs text-red-500">
          저장하지 못해 이전 상태로 되돌렸어요.
        </p>
      )}
      {showComments && (
        <div className="mt-4">
          <div className="max-h-32 overflow-y-auto rounded-lg bg-gray-50 p-3">
            {item.comments.length === 0 ? (
              <p className="text-sm text-gray-500">댓글이 없습니다.</p>
            ) : (
              item.comments.map(comment => (
                <div key={comment.id} className="mb-2 last:mb-0">
                  <div className="flex items-center">
                    <span className="text-sm font-semibold">
                      {getFamilyMemberName(comment.author)}
                    </span>
                    <span className="ml-2 text-xs text-gray-400">
                      {getRelativeTimeString(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm">{comment.text}</p>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleAddComment} className="mt-2 flex">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="댓글 추가..."
              maxLength={COMMENT_TEXT_MAX}
              className="flex-1 rounded-l-xl border border-gray-300 px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={addComment.isPending}
              className="rounded-r-xl bg-indigo-500 px-3 py-1 text-sm text-white hover:bg-indigo-600 disabled:opacity-50"
            >
              추가
            </button>
          </form>
          {addComment.isError && (
            <p className="mt-1 text-xs text-red-500">
              댓글을 저장하지 못했어요. 다시 시도해 주세요.
            </p>
          )}
        </div>
      )}
    </article>
  );
};
export default FridgeItem;
