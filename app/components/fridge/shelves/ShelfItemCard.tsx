'use client';
// app/components/fridge/shelves/ShelfItemCard.tsx
// 선반 보기 베타의 목록 줄. 그림 없이 한 줄로 촘촘하게: 이름과 총수량, 남은 날, 알림 종, 다 먹음
// - 이름을 누르면 상세(수량 바꾸기, 유통기한, 선반 옮기기, 버림, 기록)
// - 먹음(수저 아이콘과 글자)은 2개 이상 남았으면 몇 개 먹었는지 고른다. 알림 종은 "관심 품목만" 알림일 때만
// - 선반을 정하지 않은 품목은 줄 안에서 바로 선반을 고른다

import React, { useState } from 'react';
import { BellIcon, BellRingIcon, UtensilsIcon } from 'lucide-react';
import QuantityStepper from '@/app/components/common/QuantityStepper';
import { track } from '@/app/lib/analytics/gtag';
import { useCurrentFridge } from '@/app/lib/fridges/useCurrentFridge';
import {
  daysUntilExpiry,
  EXPIRY_SOON_DAYS,
  expiryLabel,
} from '@/app/lib/items/expiry';
import type { FinishKind } from '@/app/lib/items/useFinishWithUndo';
import { useUpdateItem } from '@/app/lib/items/useItems';
import { useToggleWatch } from '@/app/lib/notifications/useNotifications';
import type { Item } from '@/app/lib/schemas/item';
import { unitFor, withUnit } from '@/app/lib/items/units';

interface ShelfItemCardProps {
  item: Item;
  shelfCount: number;
  isNew?: boolean;
  onFinish: (kind: FinishKind) => void;
  onEatSome: (count: number) => void;
  onOpenDetail: () => void;
}

const ShelfItemCard: React.FC<ShelfItemCardProps> = ({
  item,
  shelfCount,
  isNew = false,
  onFinish,
  onEatSome,
  onOpenDetail,
}) => {
  const updateItem = useUpdateItem(item.id);
  const toggleWatch = useToggleWatch(item.id);
  const showsBell =
    (useCurrentFridge().data?.myNotifyLevel ?? 'watched') === 'watched';
  const remaining = item.quantity - item.eatenQuantity;
  const [eatCount, setEatCount] = useState<number | null>(null);
  const days =
    item.expiryDate === undefined ? null : daysUntilExpiry(item.expiryDate);

  const confirmEat = () => {
    if (eatCount === null) return;
    if (eatCount >= remaining) onFinish('eaten');
    else onEatSome(eatCount);
    setEatCount(null);
  };
  const placeOn = (shelf: number) =>
    updateItem.mutate(
      { id: item.id, updates: { shelf } },
      {
        onSuccess: () =>
          track('item_shelf_set', {
            category: item.category,
            from: 'unassigned',
            to: shelf,
          }),
      },
    );

  return (
    <article
      className={`rounded-xl bg-white px-3 py-1.5 text-gray-800 shadow-[0_2px_10px_rgba(75,47,140,0.06)] ring-1 ring-black/5 ${
        isNew ? 'motion-safe:animate-item-added' : ''
      }`}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenDetail}
          aria-label={`${item.name} 상세: 수량, 유통기한, 선반, 기록`}
          className="flex min-h-11 min-w-0 flex-1 flex-col justify-center rounded-lg text-left active:bg-gray-50"
        >
          <span className="truncate text-[15px] leading-tight font-semibold">
            {item.name}
          </span>
          <span className="mt-0.5 text-xs text-gray-500">
            {item.eatenQuantity > 0
              ? `총 ${withUnit(item.quantity, item.name)} 중 ${withUnit(remaining, item.name)} 남음`
              : `총 ${withUnit(item.quantity, item.name)}`}
          </span>
        </button>
        {days !== null && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              days <= EXPIRY_SOON_DAYS
                ? 'bg-red-50 text-red-600'
                : 'bg-[#F1EDFA] text-[#553C9A]'
            }`}
          >
            {expiryLabel(days)}
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
            className={`flex h-10 w-9 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 ${
              item.watched ? 'text-[#6B46C1]' : 'text-gray-300'
            }`}
          >
            {item.watched ? (
              <BellRingIcon size={18} fill="currentColor" fillOpacity={0.15} />
            ) : (
              <BellIcon size={18} />
            )}
          </button>
        )}
        {/* 먹음: 체크 표시만으로는 무슨 뜻인지 몰라 수저 아이콘과 글자를 함께 둔다. 2개 이상 남았으면 몇 개 먹었는지 고른다 */}
        <button
          type="button"
          onClick={() =>
            remaining > 1
              ? setEatCount(count => (count === null ? 1 : null))
              : onFinish('eaten')
          }
          aria-expanded={remaining > 1 ? eatCount !== null : undefined}
          aria-label={`${item.name} 먹음`}
          className={`flex h-10 shrink-0 items-center gap-1 rounded-lg px-2.5 text-sm font-semibold transition-colors ${
            eatCount !== null
              ? 'bg-[#6B46C1] text-white'
              : 'bg-[#F1EDFA] text-[#553C9A] hover:bg-[#E6DFF7]'
          }`}
        >
          <UtensilsIcon size={16} className="shrink-0" />
          먹음
        </button>
      </div>

      {eatCount !== null && (
        <div className="mb-1.5 flex items-center gap-2 rounded-lg bg-[#F8F6FD] p-1.5 pl-3">
          <span className="min-w-0 flex-1 text-sm font-medium text-gray-700">
            몇 {unitFor(item.name)} 먹었어요?
          </span>
          <QuantityStepper
            value={eatCount}
            onChange={setEatCount}
            label={`${item.name} 먹은 개수`}
            max={remaining}
            tone="white"
            unit={unitFor(item.name)}
          />
          <button
            type="button"
            onClick={confirmEat}
            className="h-10 shrink-0 rounded-lg bg-[#6B46C1] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#603fad]"
          >
            {eatCount >= remaining
              ? '모두 먹음'
              : `${withUnit(eatCount, item.name)} 먹음`}
          </button>
        </div>
      )}

      {item.shelf === null && (
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5 rounded-lg bg-amber-50 p-1.5 pl-2.5">
          <span className="mr-1 text-xs font-semibold text-amber-900">
            선반 정하기
          </span>
          {Array.from({ length: shelfCount }, (_, i) => i + 1).map(shelf => (
            <button
              key={shelf}
              type="button"
              onClick={() => placeOn(shelf)}
              aria-label={`${item.name} ${shelf}번 선반에 두기`}
              className="h-9 min-w-9 rounded-lg bg-white px-2 text-sm font-medium text-amber-900 ring-1 ring-amber-200 transition-colors hover:bg-amber-100"
            >
              {shelf}
            </button>
          ))}
        </div>
      )}

      {updateItem.isError && (
        <p className="mb-1 text-xs text-red-500">
          저장하지 못해 이전 상태로 되돌렸어요.
        </p>
      )}
    </article>
  );
};

export default ShelfItemCard;
