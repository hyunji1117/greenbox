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
  Trash2,
} from 'lucide-react';
import { track } from '@/app/lib/analytics/gtag';
import QuantityStepper from '@/app/components/common/QuantityStepper';
interface FridgeItemProps {
  item: {
    id: string;
    name: string;
    category: 'fridge' | 'freezer' | 'pantry';
    quantity: number;
    // 개수별로 먹은 수. 남은 수량은 quantity - eatenQuantity (처음 산 수량은 그대로 둔다)
    eatenQuantity: number;
    addedBy: Person;
    addedAt: Date;
    comments: Comment[];
    finished: boolean;
    expiryDate?: string;
    watched: boolean;
  };
  isNew?: boolean;
  onFinish: (kind: FinishKind) => void;
  // 일부만 먹었을 때 (남은 수량보다 적게)
  onEatSome: (count: number) => void;
}
const FridgeItem: React.FC<FridgeItemProps> = ({
  item,
  isNew = false,
  onFinish,
  onEatSome,
}) => {
  const updateItem = useUpdateItem(item.id);
  const toggleWatch = useToggleWatch(item.id);
  // 종 버튼은 알림 수준이 "관심 품목만"일 때만 뜻이 있다 (전체 품목이면 모두 알림, 받지 않음이면 모두 안 옴)
  const notifyLevel = useCurrentFridge().data?.myNotifyLevel ?? 'watched';
  const showsBell = notifyLevel === 'watched';
  const [showComments, setShowComments] = useState(false);
  const remaining = item.quantity - item.eatenQuantity;
  // 남은 게 2개 이상이면 다 먹음을 누를 때 몇 개 먹었는지 고른다
  const [eatCount, setEatCount] = useState<number | null>(null);
  const confirmEat = () => {
    if (eatCount === null) return;
    if (eatCount >= remaining) onFinish('eaten');
    else onEatSome(eatCount);
    setEatCount(null);
  };
  // 날짜를 입력하는 도중의 값. 저장 전이거나 저장에 실패하면 서버 값과 다를 수 있다
  const [expiryDraft, setExpiryDraft] = useState<string | null>(null);
  const expiryValue = expiryDraft ?? item.expiryDate ?? '';
  const expiryDays =
    item.expiryDate === undefined ? null : daysUntilExpiry(item.expiryDate);
  // 수량 칸에서 빼기, 더하기를 누르거나 직접 적은 값 (범위는 QuantityStepper가 맞춘다)
  const setQuantity = (quantity: number) => {
    updateItem.mutate(
      { id: item.id, updates: { quantity } },
      { onSuccess: () => track('item_edited', { field: 'quantity' }) },
    );
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
        {/* 처음 산 수량. 숫자를 눌러 직접 적을 수 있고, 이미 먹은 개수보다 작게는 줄이지 않는다 */}
        <QuantityStepper
          value={item.quantity}
          onChange={quantity => setQuantity(quantity)}
          label={`${item.name} 수량`}
          min={Math.max(1, item.eatenQuantity)}
          max={QUANTITY_MAX}
        />
      </div>
      {item.eatenQuantity > 0 && (
        <p className="mt-1.5 text-right text-xs font-medium text-[#553C9A]">
          {item.eatenQuantity}개 먹고 {remaining}개 남았어요
        </p>
      )}
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
          onClick={() =>
            remaining > 1
              ? setEatCount(count => (count === null ? 1 : null))
              : onFinish('eaten')
          }
          aria-expanded={remaining > 1 ? eatCount !== null : undefined}
          className={`flex h-11 items-center justify-center gap-1.5 rounded-xl transition-colors hover:bg-gray-100 ${
            eatCount !== null ? 'bg-[#F1EDFA] text-[#553C9A]' : ''
          }`}
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
      {eatCount !== null && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#F8F6FD] p-2 pl-3">
          <span className="min-w-0 flex-1 text-sm font-medium text-gray-700">
            몇 개 먹었어요?
          </span>
          <QuantityStepper
            value={eatCount}
            onChange={setEatCount}
            label={`${item.name} 먹은 개수`}
            max={remaining}
            tone="white"
          />
          <button
            type="button"
            onClick={confirmEat}
            className="h-10 shrink-0 rounded-xl bg-[#6B46C1] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#603fad]"
          >
            {eatCount >= remaining ? '모두 먹음' : `${eatCount}개 먹음`}
          </button>
        </div>
      )}
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
