'use client';
// app/components/fridge/shelves/ShelfMapPicker.tsx
// 선반 보기와 같은 배치(왼쪽 냉동실, 오른쪽 냉장실, 아래 상온)를 작게 그린 냉장고 지도
// 품목 상세의 "선반 옮기기"와, 새로 넣을 때의 "○○! 어디에 넣을까요?"(PlaceSheet)가 함께 쓴다
// - 지금 냉장고에 정한 칸 수 그대로 선반을 쌓고(1번이 맨 위), 선반마다 몇 개 있는지 적는다
// - 고르는 칸의 선반만 누를 수 있다. 다른 칸은 흐리게 두어 위치만 알려 준다 (칸 바꾸기는 여기서 하지 않는다)
// - 지금 자리는 색으로 칠하고 "지금", 추천 자리는 테두리와 "추천" 배지, 옮길 자리로 고른 선반은 점선 테두리와 "이동"
// - 가득 찬 선반(냉장과 상온 20, 냉동 30)은 노란색 "가득"으로 알리되 고를 수 있고, 최대(30, 50)면 "최대"로 막는다
// - "선반 미정"으로 되돌리는 선택은 두지 않는다 (2026-11-18)
// 버튼 줄(1번~N번)로는 몇 번이 위쪽인지, 어디가 꽉 찼는지 알 수 없다는 의견에서 바꿨다 (2026-11-18)

import React from 'react';
import type { Category, Item } from '@/app/lib/schemas/item';
import {
  SHELF_FULL_AT,
  SHELF_MAX,
  type ShelfCounts,
} from '@/app/lib/shelves/rules';
import { shelfLoads } from '@/app/lib/shelves/recommend';

export const CATEGORY_LABEL: Record<Category, string> = {
  freezer: '냉동실',
  fridge: '냉장실',
  pantry: '상온',
};

export function currentPlaceLabel(item: Pick<Item, 'category' | 'shelf'>) {
  return item.shelf === null
    ? `${CATEGORY_LABEL[item.category]}, 아직 선반을 정하지 않았어요`
    : `${CATEGORY_LABEL[item.category]} ${item.shelf}번 선반`;
}

interface ShelfMapPickerProps {
  // 고르는 칸과 식재료 이름 (화면 읽기 프로그램용 이름에 쓴다)
  category: Category;
  name: string;
  // 지금 놓인 선반. 새로 넣을 때는 null
  current: number | null;
  // 추천 선반. 없으면 표시하지 않는다
  recommended?: number;
  // 옮길 자리로 고른 선반 (선반 옮기기). "지금"은 그대로 두고 이 선반에 점선 테두리와 "이동"을 붙인다
  pending?: number | null;
  items: Item[];
  counts: ShelfCounts;
  disabled?: boolean;
  onPick: (shelf: number) => void;
}

const Compartment: React.FC<
  Omit<ShelfMapPickerProps, 'counts' | 'category'> & {
    category: Category;
    active: boolean;
    count: number;
  }
> = ({
  category,
  active,
  name,
  current,
  recommended,
  pending,
  items,
  count,
  disabled = false,
  onPick,
}) => {
  const loads = shelfLoads(items, category, count);
  return (
    <div
      className={`min-w-0 rounded-xl p-1.5 ${active ? 'bg-[#F1EDFA]' : 'bg-[#F4F4F8] opacity-50'}`}
      aria-hidden={active ? undefined : true}
    >
      <p
        className={`px-1 pb-1 text-center text-[11px] font-bold ${active ? 'text-[#553C9A]' : 'text-gray-500'}`}
      >
        {CATEGORY_LABEL[category]}
      </p>
      <div
        role={active ? 'radiogroup' : undefined}
        aria-label={active ? `${name} 선반 고르기` : undefined}
        className="flex flex-col gap-1"
      >
        {loads.map((load, index) => {
          const shelf = index + 1;
          if (!active) {
            return (
              <div
                key={shelf}
                className="flex h-8 items-center justify-between rounded-lg bg-white/70 px-2 text-xs text-gray-500"
              >
                <span className="font-semibold tabular-nums">{shelf}</span>
                <span className="tabular-nums">{load}개</span>
              </div>
            );
          }
          const isHere = current === shelf;
          const isRecommended = !isHere && recommended === shelf;
          const isPending = !isHere && pending === shelf;
          // 옮기는 품목 자신은 세지 않는다
          const isMax = !isHere && load >= SHELF_MAX[category];
          const isFull = !isHere && !isMax && load >= SHELF_FULL_AT[category];
          const state = isHere
            ? '지금 여기'
            : isPending
              ? '옮길 자리'
              : isMax
                ? '최대까지 참'
                : isFull
                  ? `가득, ${load}개`
                  : isRecommended
                    ? `추천, ${load}개`
                    : `${load}개`;
          return (
            <button
              key={shelf}
              type="button"
              role="radio"
              aria-checked={isPending || (isHere && !pending)}
              aria-label={`${shelf}번 선반, ${state}`}
              disabled={disabled || isMax}
              onClick={() => onPick(shelf)}
              className={`flex h-9 items-center justify-between rounded-lg px-2 text-xs transition-colors ${
                isHere
                  ? 'bg-[#6B46C1] text-white'
                  : isPending
                    ? 'border-2 border-dashed border-[#6B46C1] bg-[#F1EDFA] font-semibold text-[#553C9A]'
                    : isMax
                      ? 'bg-white/60 text-gray-400'
                      : isFull
                        ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200 ring-inset active:bg-amber-100'
                        : isRecommended
                          ? 'bg-white font-semibold text-[#553C9A] ring-2 ring-[#6B46C1] ring-inset active:bg-[#ECEAF3]'
                          : 'bg-white text-gray-700 active:bg-[#ECEAF3]'
              }`}
            >
              <span className="font-semibold tabular-nums">{shelf}</span>
              {isPending ? (
                <span className="rounded-full bg-[#6B46C1] px-1.5 py-0.5 text-[10px] leading-none font-bold text-white">
                  이동
                </span>
              ) : isRecommended ? (
                <span className="rounded-full bg-[#6B46C1] px-1.5 py-0.5 text-[10px] leading-none font-bold text-white">
                  추천
                </span>
              ) : (
                <span className="tabular-nums">
                  {isHere
                    ? '지금'
                    : isMax
                      ? '최대'
                      : isFull
                        ? `가득 ${load}`
                        : `${load}개`}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ShelfMapPicker: React.FC<ShelfMapPickerProps> = props => {
  const { category, counts } = props;
  const compartment = (each: Category) => (
    <Compartment
      {...props}
      key={each}
      category={each}
      active={each === category}
      count={counts[each]}
    />
  );
  // 냉장고 겉면. 선반 보기와 같은 배치로 위에 양문, 아래 상온
  return (
    <div className="space-y-1.5 rounded-2xl bg-[#D9DCE4] p-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        {compartment('freezer')}
        {compartment('fridge')}
      </div>
      {compartment('pantry')}
    </div>
  );
};

export default ShelfMapPicker;
