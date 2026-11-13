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
import { unitFor, withUnit } from '@/app/lib/items/units';
import { useUpdateItem } from '@/app/lib/items/useItems';
import { QUANTITY_MAX, type Item } from '@/app/lib/schemas/item';
import { personLabel, withSubjectParticle } from '@/app/lib/user/displayName';

interface ItemDetailSheetProps {
  item: Item | null;
  shelfCount: number;
  onClose: () => void;
  onDiscard: (item: Item) => void;
}

const placeLabel = (shelf: number | null) =>
  shelf === null ? 'unassigned' : shelf;

const ItemDetailSheet: React.FC<ItemDetailSheetProps> = ({
  item,
  shelfCount,
  onClose,
  onDiscard,
}) => {
  const updateItem = useUpdateItem(item?.id);
  const [expiryDraft, setExpiryDraft] = useState<string | null>(null);
  const [error, setError] = useState('');
  const expiryValue = expiryDraft ?? item?.expiryDate ?? '';

  const close = () => {
    setExpiryDraft(null);
    setError('');
    onClose();
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

  const moveTo = (shelf: number | null) => {
    if (!item || shelf === item.shelf) return;
    setError('');
    const from = item.shelf;
    updateItem.mutate(
      { id: item.id, updates: { shelf } },
      {
        onSuccess: () =>
          track('item_shelf_set', {
            category: item.category,
            from: placeLabel(from),
            to: placeLabel(shelf),
          }),
        onError: cause =>
          setError(
            cause instanceof ApiError &&
              (cause.body as { error?: string } | null)?.error === 'shelf_full'
              ? '이 선반이 가득 찼어요 (20개). 다른 선반에 놓아 주세요'
              : '옮기지 못했어요. 다시 시도해 주세요',
          ),
      },
    );
  };

  const shelves = Array.from({ length: shelfCount }, (_, i) => i + 1);
  const addedOn = item
    ? new Date(item.addedAt).toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <BottomSheet
      isOpen={item !== null}
      title={item?.name ?? ''}
      onClose={close}
    >
      {item && (
        <div className="space-y-3">
          <section
            className={`flex items-center justify-between gap-3 p-4 ${SURFACE}`}
          >
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-800">총수량</h3>
              <p className="mt-0.5 text-xs text-gray-500">
                {withUnit(item.quantity - item.eatenQuantity, item.name)} 남음
                {item.eatenQuantity > 0 &&
                  `, ${withUnit(item.eatenQuantity, item.name)} 먹음`}
              </p>
            </div>
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
              unit={unitFor(item.name)}
              min={Math.max(1, item.eatenQuantity)}
              max={QUANTITY_MAX}
            />
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
              넣을 때 권장 보관 기간으로 채워 두었어요. 다르면 바꿔 주세요
            </p>
          </section>

          <section className={`p-4 ${SURFACE}`}>
            <h3 className="text-sm font-semibold text-gray-800">선반 옮기기</h3>
            <div
              role="radiogroup"
              aria-label={`${item.name} 선반 고르기`}
              className="mt-2 grid grid-cols-4 gap-2"
            >
              {shelves.map(shelf => (
                <button
                  key={shelf}
                  type="button"
                  role="radio"
                  aria-checked={item.shelf === shelf}
                  onClick={() => moveTo(shelf)}
                  className={`h-11 rounded-xl text-sm font-medium transition-colors ${
                    item.shelf === shelf
                      ? 'bg-[#6B46C1] text-white'
                      : 'bg-[#F4F4F8] text-gray-700 hover:bg-[#ECEAF3]'
                  }`}
                >
                  {shelf}번
                </button>
              ))}
              <button
                type="button"
                role="radio"
                aria-checked={item.shelf === null}
                onClick={() => moveTo(null)}
                className={`col-span-2 h-11 rounded-xl text-sm font-medium transition-colors ${
                  item.shelf === null
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                선반 미정
              </button>
            </div>
            {error && (
              <p role="alert" className="mt-2 text-xs text-red-500">
                {error}
              </p>
            )}
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
