'use client';
// app/components/fridge/shelves/ItemDetailSheet.tsx
// 선반 보기 베타의 품목 상세: 수량 바꾸기, 유통기한 바꾸기, 선반 옮기기, 버림, 기록(누가 언제 넣었는지)
// 목록 줄을 촘촘하게 하려고 뺀 것들을, 품목을 누르면 여기서 보고 고친다

import React, { useState } from 'react';
import { CalendarDaysIcon, PencilIcon, Trash2 } from 'lucide-react';
import BottomSheet from '@/app/components/common/BottomSheet';
import QuantityStepper from '@/app/components/common/QuantityStepper';
import { SURFACE } from '@/app/components/common/SegmentedTabs';
import { ApiError } from '@/app/lib/api/apiFetch';
import { track } from '@/app/lib/analytics/gtag';
import { isSavableExpiryDate } from '@/app/lib/items/expiry';
import UnitChooser from '@/app/components/fridge/UnitChooser';
import { quantityLimits, unitFor, withUnit } from '@/app/lib/items/units';
import { useDeleteItem, useUpdateItem } from '@/app/lib/items/useItems';
import {
  ITEM_NAME_MAX,
  type Category,
  type Item,
} from '@/app/lib/schemas/item';
import type { ShelfCounts } from '@/app/lib/shelves/rules';
import ShelfMapPicker, {
  CATEGORY_LABEL,
  currentPlaceLabel,
} from '@/app/components/fridge/shelves/ShelfMapPicker';
import {
  personLabel,
  withObjectParticle,
  withSubjectParticle,
} from '@/app/lib/user/displayName';

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
  // 고치는 중인 이름. null이면 고치지 않는 중 (제목의 이름을 누르면 입력칸으로 바뀐다, 2026-11-22)
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  // "잘못 넣었어요"를 눌러 지울지 한 번 더 묻는 중인지 (지우면 되돌릴 수 없다)
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const deleteItem = useDeleteItem();
  // 옮길 자리로 고른 칸과 선반. 누르는 즉시 옮기지 않고 "지금 → 옮길 자리"를 보여 준 뒤 버튼으로 옮긴다 (2026-11-20)
  // 냉장실에서 넣었어도 냉동실이나 상온 선반으로 옮길 수 있다 (2026-11-22)
  const [pending, setPending] = useState<{
    category: Category;
    shelf: number;
  } | null>(null);
  const expiryValue = expiryDraft ?? item?.expiryDate ?? '';

  const close = () => {
    setNameDraft(null);
    setConfirmingDelete(false);
    setDeleteError('');
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

  // 이름 고치기. 앞뒤 공백은 지우고, 비었거나 너무 길면 저장하지 않는다. 같은 이름이 이미 있어도 막지 않는다
  const trimmedName = nameDraft?.trim() ?? '';
  const canSaveName =
    trimmedName.length > 0 && trimmedName.length <= ITEM_NAME_MAX;
  const saveName = (event: React.FormEvent) => {
    event.preventDefault();
    if (!item || !canSaveName) return;
    if (trimmedName !== item.name) {
      updateItem.mutate(
        { id: item.id, updates: { name: trimmedName } },
        { onSuccess: () => track('item_edited', { field: 'name' }) },
      );
    }
    setNameDraft(null);
  };
  // 자리 확정 화면에서는 이름을 고치지 않는다 (확정한 뒤 평소 상세에서 고친다)
  const nameTitle =
    item && !needsConfirm ? (
      nameDraft === null ? (
        <button
          type="button"
          onClick={() => setNameDraft(item.name)}
          aria-label={`${item.name}, 이름 고치기`}
          className="-mx-1 inline-flex max-w-full items-center gap-1.5 rounded-lg px-1 text-left active:bg-gray-200/60"
        >
          <span className="truncate">{item.name}</span>
          <PencilIcon
            size={14}
            aria-hidden
            className="shrink-0 text-gray-400"
          />
        </button>
      ) : (
        <form onSubmit={saveName} className="flex items-center gap-2">
          <input
            // 이름을 누른 직후 바로 고치게 한다
            autoFocus
            value={nameDraft}
            onChange={event => setNameDraft(event.target.value)}
            onBlur={() => setNameDraft(null)}
            onKeyDown={event => {
              if (event.key === 'Escape') setNameDraft(null);
            }}
            maxLength={ITEM_NAME_MAX}
            enterKeyHint="done"
            aria-label="식재료 이름"
            className="h-10 min-w-0 flex-1 rounded-xl bg-white px-3 text-base font-normal ring-1 ring-[#A794D6] outline-none"
          />
          <button
            type="submit"
            // 누르는 순간 입력칸이 포커스를 잃어 취소되지 않게 한다
            onPointerDown={event => event.preventDefault()}
            onMouseDown={event => event.preventDefault()}
            disabled={!canSaveName}
            className="h-10 shrink-0 rounded-xl bg-[#6B46C1] px-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            저장
          </button>
        </form>
      )
    ) : undefined;

  // 버림: 상해서 버린 것 (통계와 쓰레기통에 남고, 알림에서 되돌릴 수 있다)
  const discard = () => {
    if (!item) return;
    onDiscard(item);
    close();
  };
  // 잘못 넣었어요: 기록을 지운다 (통계에 남지 않는다). 서버가 지운 뒤에 닫는다
  const removeItem = (from: 'detail' | 'confirm') => {
    if (!item) return;
    setDeleteError('');
    deleteItem.mutate(item.id, {
      onSuccess: () => {
        track('item_deleted', { from });
        close();
      },
      onError: () => setDeleteError('지우지 못했어요. 다시 시도해 주세요'),
    });
  };
  const deleteConfirm = (from: 'detail' | 'confirm') =>
    item && (
      <div className="rounded-2xl bg-red-50 p-3 text-center ring-1 ring-red-100">
        <p className="text-sm font-semibold text-red-900">
          {withObjectParticle(item.name)} 지울까요?
        </p>
        <p className="mt-0.5 text-xs text-red-800">
          잘못 넣었을 때만 지워요. 통계에도 남지 않아요
        </p>
        {deleteError && (
          <p role="alert" className="mt-1 text-xs text-red-600">
            {deleteError}
          </p>
        )}
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            className="h-11 flex-1 rounded-xl bg-white text-sm font-semibold text-gray-700 ring-1 ring-black/5"
          >
            취소
          </button>
          <button
            type="button"
            disabled={deleteItem.isPending}
            onClick={() => removeItem(from)}
            className="h-11 flex-1 rounded-xl bg-red-600 text-sm font-semibold text-white disabled:opacity-50"
          >
            지우기
          </button>
        </div>
      </div>
    );

  return (
    <BottomSheet
      isOpen={item !== null}
      titleContent={nameTitle}
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
          {/* 추천 자리가 마음에 들지 않는 게 아니라 식재료 자체가 없을 때 (이미 버렸거나 잘못 들어감) */}
          {pending === null &&
            (confirmingDelete ? (
              <div className="mt-2">{deleteConfirm('confirm')}</div>
            ) : (
              <div className="mt-1 flex justify-center gap-1">
                <button
                  type="button"
                  onClick={discard}
                  className="h-10 px-3 text-sm font-medium text-gray-500"
                >
                  버렸어요
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="h-10 px-3 text-sm font-medium text-gray-500"
                >
                  잘못 넣었어요
                </button>
              </div>
            ))}
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

          {/* 버림(상해서 버림, 통계에 남음)과 잘못 넣었어요(기록을 지움, 통계에 안 남음)를 나눈다 (2026-11-22)
              잘못 넣은 것까지 버림으로 지우면 버린 음식 통계가 꼬였다 */}
          {confirmingDelete ? (
            deleteConfirm('detail')
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={discard}
                className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#F4F4F8] text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-200"
              >
                <Trash2 size={16} />
                버림
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-[#F4F4F8] text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-200"
              >
                잘못 넣었어요
              </button>
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  );
};

export default ItemDetailSheet;
