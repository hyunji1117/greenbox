import React, { useState } from 'react';
import { useFridge } from '@/app/context/FridgeContext';
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
  };
}
const FridgeItem: React.FC<FridgeItemProps> = ({ item }) => {
  const { markAsFinished, addComment, updateItem } = useFridge();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addComment(item.id, newComment);
      setNewComment('');
    }
  };
  const incrementQuantity = () => {
    updateItem(item.id, {
      quantity: item.quantity + 1,
    });
  };
  const decrementQuantity = () => {
    if (item.quantity > 1) {
      updateItem(item.id, {
        quantity: item.quantity - 1,
      });
    }
  };
  const getFamilyMemberName = (member: string): string => {
    switch (member) {
      case 'mom':
        return '먐무';
      case 'dad':
        return '빙빵';
      case 'bigKid':
        return '낭농';
      case 'littleKid':
        return '떡자';
      default:
        return member;
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
  // 현재로서는 markAsFinished와 동일한 동작을 사용합니다.
  // 추후 애플리케이션에서 "버림"과 "다 먹음"을 다르게 추적 예정.
  const handleTrashItem = () => {
    markAsFinished(item.id);
  };
  return (
    <div className="rounded-xl border-l-4 border-indigo-500 bg-white p-4 shadow-sm transition-shadow hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="relative flex items-center">
          <div className="absolute -top-6 -left-5 flex h-6 w-6 items-center justify-center rounded-full border border-[#9E9E9E] bg-white text-sm font-medium text-gray-600 shadow-sm">
            {item.quantity}
          </div>
          <div>
            <h3 className="mb-2 text-lg font-semibold">{item.name}</h3>
            <div className="flex items-center">
              <p className="mr-3 text-sm text-gray-500">
                {getFamilyMemberName(item.addedBy)}가{' '}
                {getRelativeTimeString(item.addedAt)} 추가
              </p>
            </div>
          </div>
        </div>
        <section>
          <div className="relative -top-1 flex space-x-2">
            <button
              onClick={() => setShowComments(!showComments)}
              className="relative rounded-full p-1 text-[#6B7280] shadow-sm hover:bg-gray-100"
              title="댓글"
            >
              <MessageCircleIcon size={20} />
              {item.comments.length > 0 && (
                <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-400 text-xs text-white">
                  {item.comments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => markAsFinished(item.id)}
              className="rounded-full p-1 text-[#6B7280] shadow-sm hover:bg-gray-100"
              title="다 먹음"
            >
              <CircleCheckBig size={20} />
            </button>
            <button
              onClick={handleTrashItem}
              className="rounded-full p-1 text-[#6B7280] shadow-sm hover:bg-gray-100"
              title="버림"
            >
              <Trash2 size={20} />
            </button>
          </div>
          <div className="mt-2 flex max-w-35 items-center justify-around overflow-hidden rounded-xl bg-gray-100 shadow-sm">
            <button
              onClick={decrementQuantity}
              className="px-2 py-0.5 text-[#6B7280] transition-colors hover:bg-gray-200"
              disabled={item.quantity <= 1}
            >
              <MinusIcon size={16} />
            </button>
            <span className="px-3 py-0.5 text-sm font-medium text-[#6B7280]">
              {item.quantity}
            </span>
            <button
              onClick={incrementQuantity}
              className="px-2 py-0.5 text-[#6B7280] transition-colors hover:bg-gray-200"
            >
              <PlusIcon size={16} />
            </button>
          </div>
        </section>
      </div>
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
              className="flex-1 rounded-l-xl border border-gray-300 px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-r-xl bg-indigo-500 px-3 py-1 text-sm text-white hover:bg-indigo-600"
            >
              추가
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
export default FridgeItem;
