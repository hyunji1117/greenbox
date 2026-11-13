'use client';
// app/components/fridge/shelves/FridgeShelfView.tsx
// 선반 보기 베타 (docs/decisions/0012-shelf-view-beta.md)
// - 양문형 냉장고가 닫힌 채로 보이고, 누르면 문이 양쪽으로 열린다 (움직임 줄이기면 바로 열림)
// - 왼쪽 냉동실, 오른쪽 냉장실, 아래 상온 선반. 선반마다 식재료를 사진 타일로 10개까지 가운데에 가지런히 놓는다 (전체는 선반을 눌러 목록에서)
// - 선반을 누르면 그 선반의 목록(등록, 수량, 알림)으로 들어간다
// - 선반 추가는 언제나, 줄이기는 비어 있는 선반이 있을 때만 (서버도 같은 규칙으로 거부)

import React from 'react';
import Image from 'next/image';
import { track } from '@/app/lib/analytics/gtag';
import type { Category, Item } from '@/app/lib/schemas/item';
import {
  MAX_SHELF_COUNT,
  pickStickers,
  shelfToRemove,
  type ShelfCounts,
} from '@/app/lib/shelves/rules';
import { foodIconFor } from '@/app/lib/shelves/foodIcons';

export interface ShelfTarget {
  category: Category;
  // null이면 선반 미정
  shelf: number | null;
}

interface FridgeShelfViewProps {
  items: Item[];
  counts: ShelfCounts;
  onOpenShelf: (target: ShelfTarget) => void;
  onAddShelf: (category: Category) => void;
  onRemoveShelf: (category: Category) => void;
  isChanging: boolean;
  notice: string;
  // 문이 열렸는지는 화면(FridgeBoard)이 들고 있어, 선반 목록에 갔다 와도 열린 채로 돌아온다
  // 문 닫기 버튼은 맨 위 줄(FridgeHeader 오른쪽 끝)에 있다
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const SECTION = {
  freezer: { label: '냉동실', tint: 'bg-[#EEF3FA]', text: 'text-[#2F5C99]' },
  fridge: { label: '냉장실', tint: 'bg-white', text: 'text-[#3F6B3A]' },
  pantry: { label: '상온', tint: 'bg-[#FBF7F0]', text: 'text-[#8A5A1E]' },
} as const;

// 시안과 같은 흰 타일에 사진, 아래 이름. 선반 가운데에 서로 붙지 않게 가지런히 놓고, 새로 들어오면 자석처럼 착 붙는다
export const ItemThumb: React.FC<{ name: string; size?: 'sm' | 'md' }> = ({
  name,
  size = 'sm',
}) => {
  const image = foodIconFor(name);
  const box =
    size === 'sm' ? 'h-10 w-11 rounded-[10px]' : 'h-12 w-12 rounded-xl';
  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-white shadow-[0_1px_3px_rgba(31,26,46,0.12)] ring-1 ring-black/5 ${box}`}
    >
      {image ? (
        <Image
          src={image}
          alt=""
          width={48}
          height={48}
          className="h-full w-full object-contain p-1"
        />
      ) : (
        <span className="text-sm font-bold text-[#553C9A]">
          {name.slice(0, 1)}
        </span>
      )}
    </span>
  );
};

// 선반 위 식재료: 배경 없는 그림과 바로 아래 이름(간격은 작게). 한 칸(선반 폭의 1/5)에 하나씩
// 배경 없는 식재료 그림. 그림이 없으면 연한 원에 첫 글자
const ShelfFoodImage: React.FC<{ name: string }> = ({ name }) => {
  const image = foodIconFor(name);
  return image ? (
    <Image
      src={image}
      alt=""
      width={30}
      height={30}
      className="h-[30px] w-[30px] object-contain drop-shadow-[0_1px_1px_rgba(31,26,46,0.15)]"
    />
  ) : (
    <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/80 text-xs font-bold text-[#553C9A] ring-1 ring-black/5">
      {name.slice(0, 1)}
    </span>
  );
};

const STICKERS_PER_ROW = 5;

const Sticker: React.FC<{ item: Item }> = ({ item }) => (
  <span className="motion-safe:animate-magnet flex min-w-0 flex-col items-center gap-0.5">
    <ShelfFoodImage name={item.name} />
    <span className="w-full truncate text-center text-[10px] leading-tight font-semibold text-gray-800">
      {item.name}
    </span>
  </span>
);

const ShelfColumn: React.FC<{
  category: Category;
  count: number;
  items: Item[];
  onOpen: (shelf: number) => void;
}> = ({ category, count, items, onOpen }) => {
  const section = SECTION[category];
  return (
    <div
      className={`flex min-w-0 flex-col gap-1.5 rounded-2xl p-2 ${section.tint}`}
    >
      <p className={`text-center text-xs font-bold ${section.text}`}>
        {section.label}
      </p>
      {Array.from({ length: count }, (_, i) => i + 1).map(shelf => {
        const onShelf = items.filter(item => item.shelf === shelf);
        const { shown } = pickStickers(
          onShelf,
          item => foodIconFor(item.name) !== null,
        );
        return (
          <button
            key={shelf}
            type="button"
            onClick={() => onOpen(shelf)}
            aria-label={`${section.label} ${shelf}번 선반, ${onShelf.length}개`}
            className="relative h-[104px] rounded-none border-b-4 border-white px-1 pt-3 pb-1 shadow-[0_3px_0_rgba(120,130,160,0.22)] transition-colors active:bg-black/5"
          >
            <span className="absolute top-0.5 left-1.5 text-[10px] font-semibold text-gray-400">
              {shelf}
            </span>
            {shown.length === 0 ? (
              <span className="flex min-h-[52px] items-center justify-center text-[11px] text-gray-400">
                비어 있어요
              </span>
            ) : (
              // 고정 높이 선반에 아래 줄 5칸, 위 줄 5칸. 왼쪽 아래부터 채우고, 넘치면 위 줄 왼쪽부터 (전체는 선반을 눌러 목록에서)
              <span className="flex h-full flex-col justify-end gap-1">
                {[
                  shown.slice(STICKERS_PER_ROW),
                  shown.slice(0, STICKERS_PER_ROW),
                ]
                  .filter(row => row.length > 0)
                  .map((row, index) => (
                    <span key={index} className="grid grid-cols-5 gap-x-0.5">
                      {row.map(item => (
                        <Sticker key={item.id} item={item} />
                      ))}
                    </span>
                  ))}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

const FridgeShelfView: React.FC<FridgeShelfViewProps> = ({
  items,
  counts,
  onOpenShelf,
  onAddShelf,
  onRemoveShelf,
  isChanging,
  notice,
  isOpen,
  onOpenChange,
}) => {
  const live = items.filter(item => !item.finished);
  const byCategory = (category: Category) =>
    live.filter(item => item.category === category);
  const unassigned = (category: Category) =>
    byCategory(category).filter(item => item.shelf === null);
  const canRemove = (category: Category) =>
    shelfToRemove(
      counts[category],
      new Set(
        byCategory(category)
          .map(item => item.shelf)
          .filter((shelf): shelf is number => shelf !== null),
      ),
    ) !== null;

  const open = (category: Category, shelf: number | null) => {
    const count =
      shelf === null
        ? unassigned(category).length
        : byCategory(category).filter(item => item.shelf === shelf).length;
    track('shelf_opened', {
      category,
      shelf: shelf ?? 'unassigned',
      count,
    });
    onOpenShelf({ category, shelf });
  };

  const controls = (category: Category) => (
    <div className="flex gap-1.5">
      <button
        type="button"
        onClick={() => onAddShelf(category)}
        disabled={isChanging || counts[category] >= MAX_SHELF_COUNT}
        className="h-11 flex-1 rounded-xl bg-white text-xs font-semibold text-[#553C9A] shadow-[0_4px_20px_rgba(75,47,140,0.07)] ring-1 ring-black/5 disabled:opacity-40"
      >
        선반 추가
      </button>
      <button
        type="button"
        onClick={() => onRemoveShelf(category)}
        disabled={isChanging || !canRemove(category)}
        className="h-11 flex-1 rounded-xl bg-white text-xs font-semibold text-[#553C9A] shadow-[0_4px_20px_rgba(75,47,140,0.07)] ring-1 ring-black/5 disabled:opacity-40"
      >
        선반 줄이기
      </button>
    </div>
  );

  const unassignedChips = (['freezer', 'fridge', 'pantry'] as const)
    .map(category => ({ category, count: unassigned(category).length }))
    .filter(entry => entry.count > 0);

  return (
    <div className="space-y-3">
      <div className="relative [perspective:1400px]">
        {/* 안쪽: 문이 닫혀 있을 때는 흐리게, 열리면 또렷하게 */}
        <div
          className={`grid grid-cols-2 gap-1.5 rounded-[22px] bg-[#D9DCE4] p-1.5 transition-opacity delay-200 duration-500 motion-reduce:transition-none ${
            isOpen ? 'opacity-100' : 'opacity-30'
          }`}
          inert={!isOpen}
        >
          <ShelfColumn
            category="freezer"
            count={counts.freezer}
            items={byCategory('freezer')}
            onOpen={shelf => open('freezer', shelf)}
          />
          <ShelfColumn
            category="fridge"
            count={counts.fridge}
            items={byCategory('fridge')}
            onOpen={shelf => open('fridge', shelf)}
          />
        </div>
        {/* 양문: 왼쪽은 왼쪽 경첩, 오른쪽은 오른쪽 경첩으로 바깥쪽으로 열린다 */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 left-0 w-[calc(50%-2px)] origin-left rounded-l-[22px] rounded-r-md border border-[#CBD0DA] bg-[linear-gradient(135deg,#F7F8FB_0%,#E4E7EE_100%)] transition-transform duration-1000 ease-[cubic-bezier(.25,.8,.25,1)] [backface-visibility:hidden] motion-reduce:transition-none ${
            isOpen ? '[transform:rotateY(-112deg)]' : ''
          }`}
        >
          <span className="absolute inset-x-0 top-5 text-center text-xs font-bold text-[#7D8496]">
            냉동실
          </span>
          <span className="absolute top-1/2 right-3 h-36 w-1.5 -translate-y-1/2 rounded-full bg-[linear-gradient(#C9CED8,#AEB4C0)]" />
        </div>
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 right-0 w-[calc(50%-2px)] origin-right rounded-l-md rounded-r-[22px] border border-[#CBD0DA] bg-[linear-gradient(225deg,#F7F8FB_0%,#E4E7EE_100%)] transition-transform duration-1000 ease-[cubic-bezier(.25,.8,.25,1)] [backface-visibility:hidden] motion-reduce:transition-none ${
            isOpen ? '[transform:rotateY(112deg)]' : ''
          }`}
        >
          <span className="absolute inset-x-0 top-5 text-center text-xs font-bold text-[#7D8496]">
            냉장실
          </span>
          <span className="absolute top-1/2 left-3 h-36 w-1.5 -translate-y-1/2 rounded-full bg-[linear-gradient(#C9CED8,#AEB4C0)]" />
        </div>
        {!isOpen && (
          <button
            type="button"
            onClick={() => {
              onOpenChange(true);
              track('fridge_doors_opened');
            }}
            className="absolute inset-0 flex items-end justify-center rounded-[22px] pb-6"
          >
            <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[#553C9A] shadow-[0_4px_20px_rgba(75,47,140,0.12)]">
              눌러서 냉장고 열기
            </span>
          </button>
        )}
      </div>

      {isOpen && (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            {controls('freezer')}
            {controls('fridge')}
          </div>
          <ShelfColumn
            category="pantry"
            count={counts.pantry}
            items={byCategory('pantry')}
            onOpen={shelf => open('pantry', shelf)}
          />
          {controls('pantry')}
          {unassignedChips.length > 0 && (
            <div className="flex flex-wrap gap-2 rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-100">
              <p className="w-full text-xs font-semibold text-amber-900">
                선반을 정하지 않은 식재료
              </p>
              {unassignedChips.map(({ category, count }) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => open(category, null)}
                  className="h-10 rounded-full bg-white px-3 text-sm font-medium text-amber-900 ring-1 ring-amber-200"
                >
                  {SECTION[category].label} {count}개
                </button>
              ))}
            </div>
          )}
          {notice && (
            <p role="status" className="text-center text-xs text-[#553C9A]">
              {notice}
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default FridgeShelfView;
