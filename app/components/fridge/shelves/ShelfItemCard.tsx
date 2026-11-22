'use client';
// app/components/fridge/shelves/ShelfItemCard.tsx
// 선반 보기 베타의 목록 줄. 그림 없이 한 줄로 촘촘하게: 이름과 총수량, 남은 날, 알림 종, 다 먹음
// - 이름을 누르면 상세(수량 바꾸기, 유통기한, 선반 옮기기, 버림, 기록)
// - 먹음(수저 아이콘과 글자)은 2개 이상 남았으면 몇 개 먹었는지 고른다. 알림 종은 "관심 품목만" 알림일 때만
// - 선반을 정하지 않은 품목은 줄 안에서 바로 선반을 고른다

import React, { useState } from 'react';
import { BellIcon, BellRingIcon, UtensilsIcon } from 'lucide-react';
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
import EatAmountPanel, {
  initialEatAmount,
} from '@/app/components/fridge/EatAmountPanel';
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
  const unit = unitFor(item.name, item.unit);
  const [eatCount, setEatCount] = useState<number | null>(null);
  const days =
    item.expiryDate === undefined ? null : daysUntilExpiry(item.expiryDate);

  const confirmEat = () => {
    if (eatCount === null) return;
    if (eatCount >= remaining) onFinish('eaten');
    else onEatSome(eatCount);
    setEatCount(null);
  };
  // 선반을 고르면 품목이 "선반 미정" 목록에서 바로 빠져 이 줄이 화면에서 사라진다.
  // 화면에 묶인 성공 콜백은 사라진 뒤 불리지 않으므로, 저장이 끝나기를 기다렸다가 이벤트를 보낸다
  // (실패하면 useUpdateItem이 이전 상태로 되돌리고, 줄이 남아 있으면 아래 안내가 보인다)
  const placeOn = (shelf: number) =>
    updateItem
      .mutateAsync({ id: item.id, updates: { shelf } })
      .then(() =>
        track('item_shelf_set', {
          category: item.category,
          from: 'unassigned',
          to: shelf,
        }),
      )
      .catch(() => {});

  // 앱이 추천 자리에 놓고 아직 확인하지 않은 식재료: 점선 테두리와 이름 옆 작은 표식만 두고,
  // 누르면 상세가 "○○! 여기 둘까요?"로 자리 확정부터 묻는다 (ItemDetailSheet, 2026-11-22. 카드 안 확정 줄은 목록을 어지럽혀 뺐다)
  const needsConfirm = item.autoPlaced && item.shelf !== null;
  // 카드 빈 곳을 눌러도 상세를 연다 (먹음, 알림 종, 먹은 양 고르기 같은 버튼은 그 버튼의 일만 한다)
  const openFromCard = (event: React.MouseEvent<HTMLElement>) => {
    if (eatCount !== null) return;
    if ((event.target as HTMLElement).closest('button, input, label')) return;
    onOpenDetail();
  };

  return (
    // 키보드와 화면 읽기 프로그램은 안의 이름 버튼으로 상세를 연다. 카드 클릭은 손가락이 닿는 범위를 넓히는 것뿐이다
    <article
      // 선반 둘러보기가 방금 넣은 식재료를 찾을 때 쓴다 (ShelfTour)
      data-tour-new={isNew ? 'true' : undefined}
      data-item-id={item.id}
      // 자리 확정 안내(AutoPlacedGuide)가 비추는 카드
      data-auto-placed={needsConfirm ? 'true' : undefined}
      onClick={openFromCard}
      className={`cursor-pointer rounded-xl bg-white px-3 py-1.5 text-gray-800 shadow-[0_2px_10px_rgba(75,47,140,0.06)] ${
        needsConfirm
          ? 'border-[1.5px] border-dashed border-[#6B46C1]'
          : 'ring-1 ring-black/5'
      } ${isNew ? 'motion-safe:animate-item-added' : ''}`}
    >
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenDetail}
          aria-label={
            needsConfirm
              ? `${item.name}, 앱이 추천 자리에 놓음. 눌러서 자리 정하기`
              : `${item.name} 상세: 수량, 유통기한, 선반, 기록`
          }
          // 선반 둘러보기가 비추는 곳 (ShelfTour)
          data-tour="item-name"
          className="flex min-h-11 min-w-0 flex-1 flex-col justify-center rounded-lg text-left active:bg-gray-50"
        >
          <span className="flex min-w-0 items-center gap-1">
            <span className="truncate text-[15px] leading-tight font-semibold">
              {item.name}
            </span>
            {needsConfirm && (
              <span className="shrink-0 rounded-full bg-[#F1EDFA] px-1.5 py-0.5 text-[10px] leading-none font-bold text-[#553C9A]">
                추천 자리
              </span>
            )}
          </span>
          <span className="mt-0.5 text-xs text-gray-500">
            {item.eatenQuantity > 0
              ? `총 ${withUnit(item.quantity, item.name, item.unit)} 중 ${withUnit(remaining, item.name, item.unit)} 남음`
              : `총 ${withUnit(item.quantity, item.name, item.unit)}`}
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
              ? setEatCount(count =>
                  count === null ? initialEatAmount(unit, remaining) : null,
                )
              : onFinish('eaten')
          }
          aria-expanded={remaining > 1 ? eatCount !== null : undefined}
          aria-label={`${item.name} 먹음`}
          data-tour="item-eat"
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
        <EatAmountPanel
          itemName={item.name}
          unit={unit}
          remaining={remaining}
          value={eatCount}
          onChange={setEatCount}
          onConfirm={confirmEat}
          className="mb-1.5 rounded-lg p-1.5 pl-3"
        />
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
