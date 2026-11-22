'use client';
// app/components/fridge/shelves/ItemDetailSheet.tsx
// 선반 보기 베타의 품목 상세: 수량 바꾸기, 유통기한 바꾸기, 선반 옮기기, 버림, 기록(누가 언제 넣었는지)
// 목록 줄을 촘촘하게 하려고 뺀 것들을, 품목을 누르면 여기서 보고 고친다

import React, { useState } from 'react';
import { CalendarDaysIcon, Trash2 } from 'lucide-react';
import BottomSheet from '@/app/components/common/BottomSheet';
import QuantityStepper from '@/app/components/common/QuantityStepper';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import { ApiError } from '@/app/lib/api/apiFetch';
import { track } from '@/app/lib/analytics/gtag';
import { isSavableExpiryDate } from '@/app/lib/items/expiry';
import UnitChooser from '@/app/components/fridge/UnitChooser';
import { quantityLimits, unitFor, withUnit } from '@/app/lib/items/units';
import { useUpdateItem } from '@/app/lib/items/useItems';
import type { Category, Item } from '@/app/lib/schemas/item';
import type { ShelfCounts } from '@/app/lib/shelves/rules';
import ShelfMapPicker, {
  CATEGORY_LABEL,
  currentPlaceLabel,
} from '@/app/components/fridge/shelves/ShelfMapPicker';
import { personLabel, withSubjectParticle } from '@/app/lib/user/displayName';

interface ItemDetailSheetProps {
  item: Item | null;
  // 선반 옮기기 지도에 쓰는 이 냉장고의 칸별 선반 수와 전체 품목 (선반마다 몇 개 있는지 센다)
  counts: ShelfCounts;
  items: Item[];
  onClose: () => void;
  onDiscard: (item: Item) => void;
}

const placeLabel = (shelf: number | null) =>
  shelf === null ? 'unassigned' : shelf;

const ItemDetailSheet: React.FC<ItemDetailSheetProps> = ({
  item,
  counts,
  items,
  onClose,
  onDiscard,
}) => {
  const updateItem = useUpdateItem(item?.id);
  const [expiryDraft, setExpiryDraft] = useState<string | null>(null);
  const [error, setError] = useState('');
  // 옮길 자리로 고른 칸과 선반. 누르는 즉시 옮기지 않고 "지금 → 옮길 자리"를 보여 준 뒤 버튼으로 옮긴다 (2026-11-20)
  // 냉장실에서 넣었어도 냉동실이나 상온 선반으로 옮길 수 있다 (2026-11-22)
  const [pending, setPending] = useState<{
    category: Category;
    shelf: number;
  } | null>(null);
  const expiryValue = expiryDraft ?? item?.expiryDate ?? '';

  const close = () => {
    setExpiryDraft(null);
    setError('');
    setPending(null);
    onClose();
  };
  // 선반을 누르면 옮길 자리로만 고른다. 지금 자리를 다시 누르면 고른 것을 지운다
  const pickShelf = (shelf: number, category: Category) => {
    setError('');
    const isHere = item && category === item.category && shelf === item.shelf;
    setPending(isHere ? null : { category, shelf });
  };

  const changeExpiry = (expiryDate: string) => {
    if (!item) return;
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

  const moveTo = ({
    category,
    shelf,
  }: {
    category: Category;
    shelf: number;
  }) => {
    if (!item) return;
    const changesCategory = category !== item.category;
    if (!changesCategory && shelf === item.shelf) return;
    setError('');
    const from = item.shelf;
    // 시트가 닫혀도 이벤트가 빠지지 않도록 저장이 끝나기를 기다렸다가 보낸다 (선반 정하기와 같은 방식)
    updateItem
      .mutateAsync({
        id: item.id,
        updates: changesCategory ? { category, shelf } : { shelf },
      })
      .then(() => {
        setPending(null);
        // 앱이 추천 자리에 넣어 둔 예전 식재료를 옮겼으면 그 확인으로도 센다
        if (item.autoPlaced) track('shelf_auto_checked', { result: 'moved' });
        track('item_shelf_set', {
          category: item.category,
          from: placeLabel(from),
          to: placeLabel(shelf),
          ...(changesCategory ? { to_category: category } : {}),
        });
      })
      .catch(cause =>
        setError(
          cause instanceof ApiError &&
            (cause.body as { error?: string } | null)?.error === 'shelf_full'
            ? '이 선반은 더 넣을 자리가 없어요. 다른 선반에 놓아 주세요'
            : '옮기지 못했어요. 다시 시도해 주세요',
        ),
      );
  };

  const addedOn = item
    ? new Date(item.addedAt).toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
      })
    : '';

  // 앱이 추천 자리에 놓고 아직 확인하지 않은 식재료는 자리 확정이 먼저다 (2026-11-22)
  // 목록 카드에는 점선과 작은 표식만 두고, 상세를 열면 "○○! 여기 둘까요?"로 묻는다. 확정하면 평소 상세로 넘어간다
  const needsConfirm = Boolean(item?.autoPlaced && item.shelf !== null);
  const keepHere = () => {
    if (!item || item.shelf === null) return;
    setError('');
    updateItem
      .mutateAsync({ id: item.id, updates: { shelf: item.shelf } })
      .then(() => track('shelf_auto_checked', { result: 'kept' }))
      .catch(() => setError('저장하지 못했어요. 다시 시도해 주세요'));
  };
  const shelfPicker = item && (
    <>
      <ShelfMapPicker
        category={item.category}
        name={item.name}
        current={item.shelf}
        pending={pending}
        anyCategory
        items={items}
        counts={counts}
        disabled={updateItem.isPending}
        onPick={pickShelf}
      />
      {pending !== null && (
        <button
          type="button"
          disabled={updateItem.isPending}
          onClick={() => moveTo(pending)}
          className="mt-2 h-12 w-full rounded-xl bg-[#6B46C1] text-sm font-semibold text-white disabled:opacity-50"
        >
          {CATEGORY_LABEL[item.category]}{' '}
          {item.shelf === null ? '선반 미정' : `${item.shelf}번`} →{' '}
          {pending.category !== item.category &&
            `${CATEGORY_LABEL[pending.category]} `}
          {pending.shelf}번으로 옮기기
        </button>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-500">
          {error}
        </p>
      )}
    </>
  );

  return (
    <BottomSheet
      isOpen={item !== null}
      title={
        item ? (needsConfirm ? `${item.name}! 여기 둘까요?` : item.name) : ''
      }
      centerTitle={needsConfirm}
      onClose={close}
    >
      {item && needsConfirm && (
        <section className={`p-4 ${SURFACE}`}>
          <p className="mb-2 text-center text-sm text-gray-600">
            앱이 추천 자리에 넣었어요:{' '}
            <span className="font-semibold text-gray-800">
              {currentPlaceLabel(item)}
            </span>
          </p>
          {shelfPicker}
          {pending === null && (
            <button
              type="button"
              disabled={updateItem.isPending}
              onClick={keepHere}
              className="mt-2 h-12 w-full rounded-xl bg-[#6B46C1] text-sm font-semibold text-white disabled:opacity-50"
            >
              여기 둘게요
            </button>
          )}
        </section>
      )}
      {item && !needsConfirm && (
        <div className="space-y-3">
          <section
            className={`flex items-center justify-between gap-3 p-4 ${SURFACE}`}
          >
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-800">총수량</h3>
              <p className="mt-0.5 text-xs text-gray-500">
                {withUnit(
                  item.quantity - item.eatenQuantity,
                  item.name,
                  item.unit,
                )}{' '}
                남음
                {item.eatenQuantity > 0 &&
                  `, ${withUnit(item.eatenQuantity, item.name, item.unit)} 먹음`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <QuantityStepper
                value={item.quantity}
                onChange={quantity =>
                  updateItem.mutate(
                    { id: item.id, updates: { quantity } },
                    {
                      onSuccess: () =>
                        track('item_edited', { field: 'quantity' }),
                    },
                  )
                }
                label={`${item.name} 총수량`}
                min={Math.max(1, item.eatenQuantity)}
                max={quantityLimits(unitFor(item.name, item.unit)).max}
                step={quantityLimits(unitFor(item.name, item.unit)).step}
              />
              <UnitChooser
                name={item.name}
                unit={item.unit}
                quantity={item.quantity}
                eatenQuantity={item.eatenQuantity}
                onChange={updates =>
                  updateItem.mutate({ id: item.id, updates })
                }
              />
            </div>
          </section>

          <section className={`p-4 ${SURFACE}`}>
            <label className="block text-xs font-medium text-gray-500">
              유통기한
              {/* iOS Safari의 날짜 입력은 폭과 정렬을 따르지 않아, 보이는 값은 직접 그리고 입력은 투명하게 덮는다 */}
              <span className="relative mt-1 flex h-11 items-center justify-between gap-1 rounded-xl bg-[#F4F4F8] px-3 text-base font-normal focus-within:ring-1 focus-within:ring-[#A794D6]">
                <span
                  className={`truncate ${expiryValue ? 'text-gray-700' : 'text-gray-400'}`}
                >
                  {expiryValue
                    ? expiryValue.replaceAll('-', '. ')
                    : '날짜 선택'}
                </span>
                <CalendarDaysIcon
                  size={16}
                  className="shrink-0 text-gray-500"
                />
                <input
                  type="date"
                  value={expiryValue}
                  onChange={e => changeExpiry(e.target.value)}
                  onBlur={() => setExpiryDraft(null)}
                  className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </span>
            </label>
            <p className="mt-1.5 text-xs text-gray-500">
              넣을 때 권장 보관 기간으로 채워요. 실제와 다르면 바꿔 주세요
            </p>
          </section>

          <section className={`p-4 ${SURFACE}`}>
            <h3 className="mb-1 text-sm font-semibold text-gray-800">
              선반 옮기기
            </h3>
            <p className="mb-2 text-xs text-gray-500">
              지금:{' '}
              <span className="font-semibold text-gray-800">
                {currentPlaceLabel(item)}
              </span>
            </p>
            {shelfPicker}
          </section>

          <section className={`p-4 ${SURFACE}`}>
            <h3 className="text-sm font-semibold text-gray-800">기록</h3>
            <p className="mt-1 text-sm text-gray-600">
              {withSubjectParticle(personLabel(item.addedBy))} {addedOn}에
              넣었어요
            </p>
          </section>

          <button
            type="button"
            onClick={() => {
              onDiscard(item);
              close();
            }}
            className="flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl bg-[#F4F4F8] text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-200"
          >
            <Trash2 size={16} />
            버림
          </button>
        </div>
      )}
    </BottomSheet>
  );
};

export default ItemDetailSheet;
