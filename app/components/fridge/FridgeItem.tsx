// app/components/fridge/FridgeItem.tsx
// 냉장고 아이템 컴포넌트

import React, { useState } from 'react';
import { useUpdateItem } from '@/app/lib/items/useItems';
import { useCurrentFridge } from '@/app/lib/fridges/useCurrentFridge';
import { useToggleWatch } from '@/app/lib/notifications/useNotifications';
import ItemComments from '@/app/components/fridge/ItemComments';
import type { FinishKind } from '@/app/lib/items/useFinishWithUndo';
import {
  daysUntilExpiry,
  EXPIRY_SOON_DAYS,
  expiryLabel,
  isSavableExpiryDate,
} from '@/app/lib/items/expiry';
import {
  QUANTITY_MAX,
  type Comment,
  type Person,
} from '@/app/lib/schemas/item';
import { personLabel, withSubjectParticle } from '@/app/lib/user/displayName';
import {
  BellIcon,
  BellRingIcon,
  CalendarDaysIcon,
  CircleCheckBig,
  MessageCircleIcon,
  MinusIcon,
  PlusIcon,
  Trash2,
} from 'lucide-react';
import { track } from '@/app/lib/analytics/gtag';
interface FridgeItemProps {
  item: {
    id: string;
    name: string;
    category: 'fridge' | 'freezer' | 'pantry';
    quantity: number;
    addedBy: Person;
    addedAt: Date;
    comments: Comment[];
    finished: boolean;
    expiryDate?: string;
    watched: boolean;
  };
  isNew?: boolean;
  onFinish: (kind: FinishKind) => void;
}
const FridgeItem: React.FC<FridgeItemProps> = ({
  item,
  isNew = false,
  onFinish,
}) => {
  const updateItem = useUpdateItem(item.id);
  const toggleWatch = useToggleWatch(item.id);
  // 종 버튼은 알림 수준이 "관심 품목만"일 때만 뜻이 있다 (전체 품목이면 모두 알림, 받지 않음이면 모두 안 옴)
  const notifyLevel = useCurrentFridge().data?.myNotifyLevel ?? 'watched';
  const showsBell = notifyLevel === 'watched';
  const [showComments, setShowComments] = useState(false);
  // 날짜를 입력하는 도중의 값. 저장 전이거나 저장에 실패하면 서버 값과 다를 수 있다
  const [expiryDraft, setExpiryDraft] = useState<string | null>(null);
  const expiryValue = expiryDraft ?? item.expiryDate ?? '';
  const expiryDays =
    item.expiryDate === undefined ? null : daysUntilExpiry(item.expiryDate);
  const incrementQuantity = () => {
    if (item.quantity < QUANTITY_MAX) {
      updateItem.mutate(
        { id: item.id, updates: { quantity: item.quantity + 1 } },
        { onSuccess: () => track('item_edited', { field: 'quantity' }) },
      );
    }
  };
  const decrementQuantity = () => {
    if (item.quantity > 1) {
      updateItem.mutate(
        { id: item.id, updates: { quantity: item.quantity - 1 } },
        { onSuccess: () => track('item_edited', { field: 'quantity' }) },
      );
    }
  };
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const expiryDate = e.target.value;
    setExpiryDraft(expiryDate);
    if (isSavableExpiryDate(expiryDate) && expiryDate !== item.expiryDate) {
      updateItem.mutate(
        { id: item.id, updates: { expiryDate } },
        {
          onSuccess: () => track('item_edited', { field: 'expiry' }),
          onError: () => setExpiryDraft(null),
        },
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
          {/* 상대 시간은 서버가 그린 시점과 브라우저 시점 사이에 달라질 수 있다 */}
          <p suppressHydrationWarning className="mt-0.5 text-xs text-gray-500">
            {withSubjectParticle(personLabel(item.addedBy))}{' '}
            {getRelativeTimeString(item.addedAt)} 추가
          </p>
        </div>
        <div className="-mt-1 -mr-1 flex shrink-0 items-center gap-1">
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
          {showsBell && (
            <button
              type="button"
              onClick={() => toggleWatch.mutate(!item.watched)}
              aria-pressed={item.watched}
              aria-label={
                item.watched
                  ? `${item.name} 알림 받는 중. 누르면 끄기`
                  : `${item.name} 알림 받기`
              }
              className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors hover:bg-gray-100 ${
                item.watched ? 'text-[#6B46C1]' : 'text-gray-300'
              }`}
            >
              {item.watched ? (
                <BellRingIcon
                  size={20}
                  fill="currentColor"
                  fillOpacity={0.15}
                />
              ) : (
                <BellIcon size={20} />
              )}
            </button>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <label className="min-w-0 flex-1 text-xs font-medium text-gray-500">
          유통기한
          {/* iOS Safari의 날짜 입력은 폭과 정렬을 따르지 않아, 보이는 값은 직접 그리고 입력은 투명하게 덮는다 */}
          <span className="relative mt-1 flex h-10 items-center justify-between gap-1 rounded-xl bg-[#F4F4F8] px-3 text-sm font-normal focus-within:ring-1 focus-within:ring-[#A794D6]">
            <span
              className={`truncate ${expiryValue ? 'text-gray-700' : 'text-gray-400'}`}
            >
              {expiryValue ? expiryValue.replaceAll('-', '. ') : '날짜 선택'}
            </span>
            <CalendarDaysIcon size={16} className="shrink-0 text-gray-500" />
            <input
              type="date"
              value={expiryValue}
              onChange={handleExpiryChange}
              onBlur={() => setExpiryDraft(null)}
              className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </span>
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
          onClick={() => {
            if (!showComments) track('item_comments_opened');
            setShowComments(!showComments);
          }}
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
        <ItemComments
          itemId={item.id}
          comments={item.comments}
          relativeTime={getRelativeTimeString}
        />
      )}
    </article>
  );
};
export default FridgeItem;
