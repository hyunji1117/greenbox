'use client';
// app/components/stats/FoodBins.tsx
// 통계의 "먹은 음식(위)"과 "버린 음식(쓰레기통)". 먹음과 버림은 시간이 지나도 되돌리고 싶을 때가 있어 여기서 꺼낸다
// - 위와 회색 양철 쓰레기통을 크게 하나씩 두고, 누르면 배경이 어두워지며 안을 들여다보듯 음식이 보인다
// - 안의 음식을 누르면 목록으로 바뀌고, 목록에서 "냉장고로 꺼내기"를 누르면 냉장고로 돌아간다
// - 최근 30일 안의 것만, 최근 순으로 보여 준다 (app/lib/items/finishedFood.ts)

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { ChevronLeftIcon, Undo2Icon, XIcon } from 'lucide-react';
import { track } from '@/app/lib/analytics/gtag';
import {
  FINISHED_WINDOW_DAYS,
  isEatenUp,
  restoreUpdates,
  scatterPositions,
  splitFinished,
} from '@/app/lib/items/finishedFood';
import { useUpdateItem } from '@/app/lib/items/useItems';
import { withUnit } from '@/app/lib/items/units';
import type { Item } from '@/app/lib/schemas/item';
import { foodIconFor } from '@/app/lib/shelves/foodIcons';

type BinKind = 'eaten' | 'discarded';

// 들여다볼 때 안에 놓는 음식 수 (나머지는 목록에서)
const MAX_PEEK = 24;

const BIN = {
  eaten: {
    label: '먹은 음식',
    peekTitle: '위 속을 들여다봐요',
    empty: '최근에 다 먹은 음식이 없어요',
  },
  discarded: {
    label: '버린 음식',
    peekTitle: '쓰레기통 안을 들여다봐요',
    empty: '최근에 버린 음식이 없어요',
  },
} as const;

// 배경 없는 식재료 그림. 없으면 첫 글자 원
const FoodIcon: React.FC<{ name: string; size: number }> = ({ name, size }) => {
  const image = foodIconFor(name);
  return image ? (
    <Image
      src={image}
      alt=""
      width={size}
      height={size}
      className="object-contain drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="flex items-center justify-center rounded-full bg-white/90 font-bold text-[#553C9A] shadow"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.slice(0, 1)}
    </span>
  );
};

// 위: 분홍빛 위 모양 (식도에서 내려와 오른쪽으로 불룩하고 왼쪽 아래로 나간다)
const STOMACH_PATH =
  'M78 8 C78 2 96 2 96 8 L98 44 C130 30 186 50 190 104 C194 160 140 196 92 186 C62 180 42 168 30 176 C22 182 10 176 12 166 C14 154 30 150 40 146 C52 140 40 120 48 100 C56 82 78 78 80 60 Z';

const StomachArt: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 200" aria-hidden className={className}>
    <defs>
      <radialGradient id="stomach-fill" cx="60%" cy="55%" r="60%">
        <stop offset="0%" stopColor="#FFE1E8" />
        <stop offset="100%" stopColor="#F4A9BC" />
      </radialGradient>
    </defs>
    <path
      d={STOMACH_PATH}
      fill="url(#stomach-fill)"
      stroke="#E0849C"
      strokeWidth="4"
      strokeLinejoin="round"
    />
    <path
      d="M110 70 C140 66 168 86 168 112"
      fill="none"
      stroke="#fff"
      strokeOpacity="0.6"
      strokeWidth="6"
      strokeLinecap="round"
    />
  </svg>
);

// 회색 양철 쓰레기통 (옆에서 본 모양: 뚜껑, 손잡이, 세로 골)
const TrashCanArt: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 200" aria-hidden className={className}>
    <defs>
      <linearGradient id="tin-body" x1="0" x2="1">
        <stop offset="0%" stopColor="#8E949E" />
        <stop offset="35%" stopColor="#D5D9DF" />
        <stop offset="60%" stopColor="#B4BAC3" />
        <stop offset="100%" stopColor="#7F858F" />
      </linearGradient>
      <linearGradient id="tin-lid" x1="0" x2="1">
        <stop offset="0%" stopColor="#9AA0AA" />
        <stop offset="45%" stopColor="#E3E6EA" />
        <stop offset="100%" stopColor="#8A909A" />
      </linearGradient>
    </defs>
    <path
      d="M44 62 L156 62 L146 186 C146 192 54 192 54 186 Z"
      fill="url(#tin-body)"
      stroke="#6E747E"
      strokeWidth="3"
    />
    {[66, 84, 100, 116, 134].map(x => (
      <path
        key={x}
        d={`M${x} 72 L${x + (x - 100) * -0.06} 180`}
        stroke="#7D838D"
        strokeOpacity="0.55"
        strokeWidth="3"
        strokeLinecap="round"
      />
    ))}
    <ellipse
      cx="100"
      cy="60"
      rx="62"
      ry="12"
      fill="url(#tin-lid)"
      stroke="#6E747E"
      strokeWidth="3"
    />
    <path
      d="M84 48 C84 34 116 34 116 48"
      fill="none"
      stroke="#6E747E"
      strokeWidth="6"
      strokeLinecap="round"
    />
  </svg>
);

// 들여다볼 때의 안쪽 모양. 위는 같은 모양을 크게, 쓰레기통은 위에서 내려다본 둥근 통 속
const PeekArt: React.FC<{ kind: BinKind }> = ({ kind }) =>
  kind === 'eaten' ? (
    <StomachArt className="absolute inset-0 h-full w-full" />
  ) : (
    <svg
      viewBox="0 0 200 200"
      aria-hidden
      className="absolute inset-0 h-full w-full"
    >
      <defs>
        <radialGradient id="tin-inside" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#5B6068" />
          <stop offset="100%" stopColor="#25282D" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill="url(#tin-inside)" />
      <circle
        cx="100"
        cy="100"
        r="92"
        fill="none"
        stroke="#C3C8CF"
        strokeWidth="10"
      />
      <circle
        cx="100"
        cy="100"
        r="86"
        fill="none"
        stroke="#8E949E"
        strokeWidth="2"
      />
    </svg>
  );

// 음식을 흩어 놓을 안쪽 영역 (그림 크기에 대한 비율). 위는 불룩한 아래쪽, 쓰레기통은 둥근 바닥
const PEEK_AREA = {
  eaten: { left: 0.3, top: 0.36, width: 0.55, height: 0.42 },
  discarded: { left: 0.2, top: 0.2, width: 0.6, height: 0.6 },
} as const;

const RestoreRow: React.FC<{ item: Item }> = ({ item }) => {
  const update = useUpdateItem(item.id);
  const at = item.updatedAt ?? item.addedAt;
  return (
    <li className="flex items-center gap-3 py-2">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center">
        <FoodIcon name={item.name} size={32} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-gray-800">
          {item.name}
        </span>
        <span className="text-xs text-gray-500">
          {at.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
          {isEatenUp(item)
            ? `, ${withUnit(item.quantity, item.name)} 다 먹음`
            : `, ${withUnit(item.quantity - item.eatenQuantity, item.name)} 버림`}
        </span>
      </span>
      <button
        type="button"
        disabled={update.isPending}
        onClick={() =>
          update.mutate(
            { id: item.id, updates: restoreUpdates(item) },
            {
              onSuccess: () =>
                track('finished_item_restored', {
                  from: isEatenUp(item) ? 'eaten' : 'discarded',
                }),
            },
          )
        }
        className="flex h-10 shrink-0 items-center gap-1 rounded-xl bg-[#F1EDFA] px-3 text-sm font-semibold text-[#553C9A] transition-colors hover:bg-[#E6DFF7] disabled:opacity-60"
      >
        <Undo2Icon size={15} />
        냉장고로 꺼내기
      </button>
    </li>
  );
};

const PeekOverlay: React.FC<{
  kind: BinKind;
  items: Item[];
  onClose: () => void;
}> = ({ kind, items, onClose }) => {
  const [isList, setIsList] = useState(false);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const shown = items.slice(0, MAX_PEEK);
  const area = PEEK_AREA[kind];
  const positions = scatterPositions(shown.length);
  const openList = () => {
    setIsList(true);
    track('food_bin_list_opened', { bin: kind });
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={BIN[kind].label}
      className="motion-safe:animate-tab-fade fixed inset-0 z-[60] flex flex-col bg-[rgba(17,12,34,0.82)] px-4 pt-[max(16px,env(safe-area-inset-top))] pb-[max(16px,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center justify-between text-white">
        {isList ? (
          <button
            type="button"
            onClick={() => setIsList(false)}
            className="flex h-11 items-center gap-1 rounded-xl pr-3 text-sm font-semibold"
          >
            <ChevronLeftIcon size={18} />
            다시 들여다보기
          </button>
        ) : (
          <p className="text-sm font-semibold">{BIN[kind].peekTitle}</p>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10"
        >
          <XIcon size={20} />
        </button>
      </div>

      {isList ? (
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-2xl bg-white px-4 py-2">
          <p className="pt-2 text-xs text-gray-500">
            최근 {FINISHED_WINDOW_DAYS}일 동안의 {BIN[kind].label}이에요. 잘못
            눌렀다면 냉장고로 꺼낼 수 있어요
          </p>
          <ul className="divide-y divide-gray-100">
            {items.map(item => (
              <RestoreRow key={item.id} item={item} />
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="relative aspect-square w-full max-w-[340px]">
            <PeekArt kind={kind} />
            {/* 안의 음식을 누르면 목록으로 */}
            <button
              type="button"
              onClick={openList}
              aria-label={`${BIN[kind].label} ${items.length}개 목록으로 보기`}
              className="absolute"
              style={{
                left: `${area.left * 100}%`,
                top: `${area.top * 100}%`,
                width: `${area.width * 100}%`,
                height: `${area.height * 100}%`,
              }}
            >
              {shown.map((item, i) => (
                <span
                  key={item.id}
                  className="motion-safe:animate-magnet absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${positions[i].x * 100}%`,
                    top: `${positions[i].y * 100}%`,
                  }}
                >
                  <FoodIcon name={item.name} size={34} />
                </span>
              ))}
            </button>
          </div>
          <button
            type="button"
            onClick={openList}
            className="h-11 rounded-full bg-white/15 px-5 text-sm font-semibold text-white"
          >
            목록으로 보기 ({items.length}개)
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
};

const FoodBins: React.FC<{ items: Item[] }> = ({ items }) => {
  const { eaten, discarded } = splitFinished(items);
  const [open, setOpen] = useState<BinKind | null>(null);
  const bins: { kind: BinKind; list: Item[] }[] = [
    { kind: 'eaten', list: eaten },
    { kind: 'discarded', list: discarded },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {bins.map(({ kind, list }) => (
          <button
            key={kind}
            type="button"
            disabled={list.length === 0}
            onClick={() => {
              setOpen(kind);
              track('food_bin_opened', { bin: kind, count: list.length });
            }}
            aria-label={
              list.length === 0
                ? BIN[kind].empty
                : `${BIN[kind].label} ${list.length}개, 들여다보기`
            }
            className="flex flex-col items-center rounded-2xl bg-[#F4F4F8] px-2 pt-3 pb-2.5 transition-colors active:bg-[#ECEAF3] disabled:opacity-70"
          >
            {kind === 'eaten' ? (
              <StomachArt className="h-24 w-24" />
            ) : (
              <TrashCanArt className="h-24 w-24" />
            )}
            <span className="mt-1 text-sm font-semibold text-gray-800">
              {BIN[kind].label}
            </span>
            <span className="text-xs text-gray-500">
              {list.length === 0 ? '없어요' : `${list.length}개`}
            </span>
          </button>
        ))}
      </div>
      {open && (
        <PeekOverlay
          kind={open}
          items={open === 'eaten' ? eaten : discarded}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
};

export default FoodBins;
