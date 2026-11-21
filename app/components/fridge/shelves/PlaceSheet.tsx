'use client';
// app/components/fridge/shelves/PlaceSheet.tsx
// 식재료를 넣기 전에 "오이! 어디에 넣을까요?"를 묻는 시트 (선반 보기, 2026-11-19)
// - 이름이 길어도 한 줄에 들어가게 "이름! 어디에 넣을까요?" 형식으로 통일한다
// - 추천은 배지와 자리 한 줄, 이유 한 줄만 (app/lib/shelves/recommend.ts)
// - 선반을 누르면 바로 그 자리에 넣고, "추천 자리에 넣기"는 추천 선반에 넣는다. 선반 미정은 고를 수 없다
// - 가득 찬 선반(냉장과 상온 20, 냉동 30)을 고르면 막지 않고 한 번 알린다: 그 선반에서 유통기한이 임박한 것을 보여 주고
//   "그래도 넣기"로 넣는다. 최대(30, 50)까지 찬 선반은 지도에서 고를 수 없다 (2026-11-20)
// - 냉장고에 같은 이름이 이미 있으면(다 먹지 않은 것) 지도보다 먼저 알린다: "그 버섯이에요"면 새로 넣지 않고
//   (앱이 넣어 둔 것이면 그 자리로 확정), "하나 더 넣기"면 평소처럼 고른다. 들어간 줄 모르고 또 넣지 않게 (2026-11-20)
// - 닫으면 아무것도 저장하지 않는다
// 빠른 추가, 사진 등록, 장보기 구매 완료가 모두 이 시트를 거친다

import React, { useState } from 'react';
import BottomSheet from '@/app/components/common/BottomSheet';
import ShelfMapPicker, {
  CATEGORY_LABEL,
} from '@/app/components/fridge/shelves/ShelfMapPicker';
import VoicePlaceAsk from '@/app/components/fridge/shelves/VoicePlaceAsk';
import { daysUntilExpiry, expiryLabel } from '@/app/lib/items/expiry';
import { withSubjectParticle } from '@/app/lib/user/displayName';
import type { Category, Item } from '@/app/lib/schemas/item';
import { SHELF_FULL_AT, type ShelfCounts } from '@/app/lib/shelves/rules';
import {
  recommendPlace,
  shelfLoads,
  shelfPlaceName,
} from '@/app/lib/shelves/recommend';

export const placeQuestion = (name: string) => `${name}! 어디에 넣을까요?`;

// "그 버섯이에요" / "그 두부예요" (마지막 글자 받침에 따라)
export function thatOneLabel(name: string): string {
  const code = name.charCodeAt(name.length - 1);
  const hasFinal =
    code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
  return `그 ${name}${hasFinal ? '이에요' : '예요'}`;
}

// 냉장고에 이미 있는 같은 이름 (다 먹지 않은 것). 띄어쓰기는 무시한다
export function findExisting(name: string, items: Item[]): Item | null {
  const key = name.replace(/\s+/g, '');
  return (
    items.find(
      item => !item.finished && item.name.replace(/\s+/g, '') === key,
    ) ?? null
  );
}

// 처음에 보여 주는 임박한 식재료 수. "유통기한 임박 보기"를 누르면 그 선반 전체
const SOON_PREVIEW = 3;

interface PlaceSheetProps {
  // 넣으려는 식재료. null이면 닫혀 있다
  name: string | null;
  category: Category;
  counts: ShelfCounts;
  items: Item[];
  isPending?: boolean;
  error?: string;
  onPlace: (shelf: number) => void;
  onClose: () => void;
  // 말로 넣을 때: 들은 이름을 보여 주고, 소리로 묻고, 말로 답을 받는다 (추천 상자 대신)
  voice?: boolean;
  // 같은 이름이 이미 있을 때 "그 ○○이에요"를 누르면 (새로 넣지 않는다). 없으면 묻지 않는다
  onUseExisting?: (existing: Item) => void;
}

const PlaceSheet: React.FC<PlaceSheetProps> = ({
  name,
  category,
  counts,
  items,
  isPending = false,
  error,
  onPlace,
  onClose,
  voice = false,
  onUseExisting,
}) => {
  // 같은 이름이 이미 있다고 알린 뒤 "하나 더 넣기"를 골랐는지
  const [addAnother, setAddAnother] = useState(false);
  // 가득 찬 선반을 골랐을 때 한 번 더 보여 주는 선반과, 임박한 것 전체를 펼쳤는지
  const [fullShelf, setFullShelf] = useState<number | null>(null);
  const [showAllSoon, setShowAllSoon] = useState(false);
  const recommendation =
    name !== null ? recommendPlace(name, category, counts, items) : null;
  const loads = shelfLoads(items, category, counts[category]);

  const close = () => {
    setFullShelf(null);
    setShowAllSoon(false);
    setAddAnother(false);
    onClose();
  };
  const existing =
    name !== null && onUseExisting && !addAnother
      ? findExisting(name, items)
      : null;
  const pick = (shelf: number) => {
    if (loads[shelf - 1] >= SHELF_FULL_AT[category]) {
      setFullShelf(shelf);
      setShowAllSoon(false);
      return;
    }
    onPlace(shelf);
  };
  const placeAnyway = (shelf: number) => {
    setFullShelf(null);
    onPlace(shelf);
  };

  // 가득 찬 선반의 식재료를 유통기한이 가까운 순서로
  const soonOnShelf =
    fullShelf === null
      ? []
      : items
          .filter(
            item =>
              !item.finished &&
              item.category === category &&
              item.shelf === fullShelf &&
              item.expiryDate,
          )
          .map(item => ({
            item,
            days: daysUntilExpiry(item.expiryDate as string),
          }))
          .sort((a, b) => a.days - b.days);
  const shownSoon = showAllSoon
    ? soonOnShelf
    : soonOnShelf.slice(0, SOON_PREVIEW);

  return (
    <BottomSheet
      isOpen={name !== null}
      title={name !== null ? placeQuestion(name) : ''}
      onClose={close}
      centerTitle
    >
      {name !== null && existing && (
        <div className="space-y-3">
          <div className="rounded-xl bg-amber-50 px-3 py-3 text-center ring-1 ring-amber-200">
            <p className="text-sm font-bold text-amber-900">
              냉장고에 {withSubjectParticle(name)} 이미 있어요
            </p>
            <p className="mt-0.5 text-xs text-amber-800">
              {existing.shelf !== null
                ? shelfPlaceName(
                    existing.category,
                    existing.shelf,
                    counts[existing.category],
                  )
                : `${CATEGORY_LABEL[existing.category]}, 아직 선반을 정하지 않았어요`}
              {existing.autoPlaced && ' · 앱이 넣어 둠'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAddAnother(true)}
              className="h-12 flex-1 rounded-xl bg-white text-sm font-semibold text-gray-700 ring-1 ring-black/5"
            >
              하나 더 넣기
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setAddAnother(false);
                onUseExisting?.(existing);
              }}
              className="h-12 flex-1 rounded-xl bg-[#6B46C1] text-sm font-semibold text-white disabled:opacity-50"
            >
              {thatOneLabel(name)}
            </button>
          </div>
        </div>
      )}
      {name !== null && recommendation && !existing && fullShelf !== null && (
        <div className="space-y-3">
          <div className="rounded-xl bg-amber-50 px-3 py-3 text-center ring-1 ring-amber-200">
            <p className="text-sm font-bold text-amber-900">
              {CATEGORY_LABEL[category]} {fullShelf}번 선반이 가득 찼어요
            </p>
            <p className="mt-0.5 text-xs text-amber-800">
              그래도 넣을 수 있어요. 임박한 것부터 먹으면 자리가 생겨요
            </p>
          </div>
          {shownSoon.length > 0 && (
            <ul
              aria-label="유통기한 임박한 식재료"
              className="divide-y divide-dashed divide-gray-200 rounded-xl bg-white px-3 ring-1 ring-black/5"
            >
              {shownSoon.map(({ item, days }) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 py-2 text-sm"
                >
                  <span className="min-w-0 truncate text-gray-800">
                    {item.name}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      days <= 3
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-[#F1EDFA] text-[#553C9A]'
                    }`}
                  >
                    {expiryLabel(days)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {error && (
            <p role="alert" className="text-center text-xs text-red-500">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              aria-expanded={showAllSoon}
              disabled={soonOnShelf.length <= SOON_PREVIEW}
              onClick={() => setShowAllSoon(true)}
              className="h-12 flex-1 rounded-xl bg-white text-sm font-semibold text-gray-700 ring-1 ring-black/5 disabled:opacity-50"
            >
              유통기한 임박 보기
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => placeAnyway(fullShelf)}
              className="h-12 flex-1 rounded-xl bg-[#6B46C1] text-sm font-semibold text-white disabled:opacity-50"
            >
              그래도 넣기
            </button>
          </div>
          <button
            type="button"
            onClick={() => setFullShelf(null)}
            className="mx-auto block h-10 px-3 text-sm font-medium text-gray-600"
          >
            다른 자리 고르기
          </button>
        </div>
      )}
      {name !== null && recommendation && !existing && fullShelf === null && (
        <div className="space-y-3">
          {voice ? (
            <VoicePlaceAsk
              name={name}
              category={category}
              shelfCount={counts[category]}
              recommended={recommendation.shelf}
              recommendedPlace={shelfPlaceName(
                category,
                recommendation.shelf,
                counts[category],
              )}
              onPick={pick}
            />
          ) : (
            <div className="rounded-xl bg-[#F1EDFA] px-3 py-2 text-center">
              <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-[#553C9A]">
                <span className="rounded-full bg-[#6B46C1] px-1.5 py-0.5 text-[11px] leading-none font-bold text-white">
                  추천
                </span>
                {shelfPlaceName(
                  category,
                  recommendation.shelf,
                  counts[category],
                )}
              </p>
              <p className="mt-0.5 truncate text-xs text-gray-600">
                {recommendation.reason}
              </p>
            </div>
          )}
          <ShelfMapPicker
            category={category}
            name={name}
            current={null}
            recommended={recommendation.shelf}
            items={items}
            counts={counts}
            disabled={isPending}
            onPick={pick}
          />
          {error && (
            <p role="alert" className="text-center text-xs text-red-500">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={close}
              className="h-12 flex-1 rounded-xl bg-white text-sm font-semibold text-gray-700 ring-1 ring-black/5"
            >
              닫기
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => pick(recommendation.shelf)}
              className="h-12 flex-1 rounded-xl bg-[#6B46C1] text-sm font-semibold text-white disabled:opacity-50"
            >
              추천 자리에 넣기
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
};

export default PlaceSheet;
