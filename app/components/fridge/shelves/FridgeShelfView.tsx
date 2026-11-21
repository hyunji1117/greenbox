'use client';
// app/components/fridge/shelves/FridgeShelfView.tsx
// 선반 보기 베타 (docs/decisions/0012-shelf-view-beta.md)
// - 양문형 냉장고가 닫힌 채로 보이고, 누르면 문이 양쪽으로 열린다 (움직임 줄이기면 바로 열림)
// - 가운데에서 옆으로 밀어도 열리고, 열린 뒤 양쪽 절반이나 화면 끝에서 안쪽으로 밀면 닫힌다 (app/lib/shelves/doorSwipe.ts)
// - 왼쪽 냉동실, 오른쪽 냉장실, 아래 상온 선반. 선반마다 식재료를 사진 타일로 10개까지 가운데에 가지런히 놓는다 (전체는 선반을 눌러 목록에서)
// - 선반을 누르면 그 선반의 목록(등록, 수량, 알림)으로 들어간다
// - 선반 추가는 언제나, 줄이기는 비어 있는 선반이 있을 때만 (서버도 같은 규칙으로 거부)

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import { track } from '@/app/lib/analytics/gtag';
import type { Category, Item } from '@/app/lib/schemas/item';
import {
  MAX_SHELF_COUNT,
  MIN_SHELF_COUNT,
  pickStickers,
  shelfToRemove,
  type ShelfCounts,
} from '@/app/lib/shelves/rules';
import { foodIconFor } from '@/app/lib/shelves/foodIcons';
import {
  doorSwipeResult,
  doorSwipeStart,
  screenEdgeStart,
  type DoorSwipeStart,
} from '@/app/lib/shelves/doorSwipe';
import ShelfUpdateGuide from '@/app/components/fridge/shelves/ShelfUpdateGuide';
import AutoPlaceCheck from '@/app/components/fridge/shelves/AutoPlaceCheck';
import { ShelfTourStart } from '@/app/components/fridge/shelves/ShelfTour';
import { isIntroDone } from '@/app/lib/shelves/autoPlacePrompt';
import { useShelfTourStep, wantsShelfTour } from '@/app/lib/shelves/shelfTour';

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
  // 문이 닫혀 있을 때 문 위에 붙이는 것 (가족 게시판 메모). 여는 버튼보다 위에 놓인다
  doorContent?: React.ReactNode;
  // 선반 보기 소개, 둘러보기, 업데이트 안내(알림장, 밀어서 닫기)를 사람마다 한 번 보여 주기 위한 내 사용자 id
  guideUserId?: string;
  // 알림 첫 질문처럼 먼저 끝나야 하는 것이 떠 있으면 안내를 미룬다
  guidesBlocked?: boolean;
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
// 고정 높이 선반(104px)에 두 줄이 차도 왼쪽 위 선반 번호와 겹치지 않도록 그림은 26px로 둔다
const ShelfFoodImage: React.FC<{ name: string }> = ({ name }) => {
  const image = foodIconFor(name);
  return image ? (
    <Image
      src={image}
      alt=""
      width={26}
      height={26}
      className="h-[26px] w-[26px] object-contain drop-shadow-[0_1px_1px_rgba(31,26,46,0.15)]"
    />
  ) : (
    <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-white/80 text-[11px] font-bold text-[#553C9A] ring-1 ring-black/5">
      {name.slice(0, 1)}
    </span>
  );
};

// 문 위쪽의 칸 이름 표지판: 작은 금속판에 나사 두 개를 박은 모양
const DoorSign: React.FC<{ label: string }> = ({ label }) => (
  <span className="absolute inset-x-0 top-4 flex justify-center">
    <span className="flex items-center gap-1.5 rounded-[4px] border border-[#B4BAC6] bg-[linear-gradient(180deg,#FFFFFF_0%,#E9ECF1_100%)] px-1.5 py-0.5 shadow-[0_1px_2px_rgba(31,26,46,0.18)]">
      <span className="h-1 w-1 rounded-full bg-[#AEB4C0]" />
      <span className="text-[11px] font-bold tracking-[0.08em] text-[#56607A]">
        {label}
      </span>
      <span className="h-1 w-1 rounded-full bg-[#AEB4C0]" />
    </span>
  </span>
);

const STICKERS_PER_ROW = 5;

// 선반 한 칸에 이름을 "…" 없이 5글자까지 보인다 (전체 이름은 선반 목록에서)
// 글자 크기, 굵기, 자간은 모두 같게 두어 줄이 가지런해 보이게 하고, 칸 너비는 화면마다 달라
// 그린 뒤 실제 너비를 재서 넘칠 때만 그 칸에 딱 맞게 옆으로 누른다 (옆 칸 이름과 겹치지 않게)
export const STICKER_NAME_MAX = 5;
const STICKER_NAME_CLASS = 'text-[9px] tracking-[-0.02em]';

export function stickerName(name: string): { text: string; className: string } {
  const text = Array.from(name.replace(/\s+/g, ''))
    .slice(0, STICKER_NAME_MAX)
    .join('');
  return { text, className: STICKER_NAME_CLASS };
}

const FitLabel: React.FC<{ text: string; className: string }> = ({
  text,
  className,
}) => {
  const boxRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const box = boxRef.current;
    const label = textRef.current;
    if (!box || !label) return;
    const fit = () => {
      const available = box.clientWidth;
      const needed = label.scrollWidth;
      setScale(available > 0 && needed > available ? available / needed : 1);
    };
    fit();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [text, className]);
  return (
    <span
      ref={boxRef}
      aria-hidden
      // 바깥 칸도 글자 크기와 줄 높이를 이름과 맞춘다. 기본 16px 줄 높이(약 24px)를 물려받으면
      // 두 줄일 때 고정 높이 선반을 넘쳐 위 줄 그림이 선반 번호를 덮는다 (2026-11-15 재테스트에서 확인)
      className="block h-[10px] w-full overflow-hidden text-center text-[9px] leading-none"
    >
      {/* 넘치면 칸의 왼쪽 끝부터 그려지므로 왼쪽을 기준으로 줄여 칸 안에 맞춘다 */}
      <span
        ref={textRef}
        className={`inline-block origin-left leading-none font-semibold whitespace-nowrap text-gray-800 ${className}`}
        style={scale < 1 ? { transform: `scaleX(${scale})` } : undefined}
      >
        {text}
      </span>
    </span>
  );
};

// 앱이 추천 자리에 넣고 아직 자리를 확정하지 않은 식재료는 점선 테두리로 구분한다 (AutoPlaceCheck와 같은 모양)
const Sticker: React.FC<{ item: Item }> = ({ item }) => {
  const label = stickerName(item.name);
  return (
    <span
      className={`motion-safe:animate-magnet flex min-w-0 flex-col items-center gap-0.5 rounded-md ${
        item.autoPlaced
          ? 'border-[1.5px] border-dashed border-[#6B46C1] px-0.5'
          : ''
      }`}
    >
      <ShelfFoodImage name={item.name} />
      <FitLabel text={label.text} className={label.className} />
    </span>
  );
};

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
            className="relative h-[104px] rounded-none border-b-4 border-white px-1 pt-4 pb-1 shadow-[0_3px_0_rgba(120,130,160,0.22)] transition-colors active:bg-black/5"
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
              <span className="flex h-full flex-col justify-end gap-0.5">
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
  doorContent,
  guideUserId,
  guidesBlocked = false,
}) => {
  // 예전 식재료 배치 안내가 떠 있는 동안은 알림장, 밀어서 닫기 안내를 미룬다 (안내가 문을 열어 겹치지 않게)
  const [autoPromptActive, setAutoPromptActive] = useState(false);
  const tourStep = useShelfTourStep();
  const tourDone =
    guideUserId !== undefined &&
    tourStep === null &&
    isIntroDone(guideUserId) &&
    !wantsShelfTour(guideUserId);
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

  // 줄일 수 없을 때도 버튼을 누를 수 있게 두고, 누르면 서버에 묻지 않고 이유를 알려 준다 (ADR 0012)
  // 안내는 누른 버튼 바로 아래에 보인다 (아래쪽에 모아 두면 스크롤해야 보였다)
  const [blocked, setBlocked] = useState<{
    category: Category;
    text: string;
  } | null>(null);
  const removeShelf = (category: Category) => {
    if (canRemove(category)) {
      setBlocked(null);
      onRemoveShelf(category);
      return;
    }
    setBlocked({
      category,
      text:
        counts[category] <= MIN_SHELF_COUNT
          ? '선반은 하나 이상 있어야 해요'
          : '식재료가 있는 선반은 줄일 수 없어요. 옮기거나 다 먹음으로 비운 뒤 줄여 주세요',
    });
  };
  // 화면이 작으면(360px 높이 800) 버튼 바로 아래도 하단 메뉴에 가려, 안내가 뜨면 메뉴 위까지 보이게 스크롤한다
  // scroll-margin으로 하단 메뉴 높이(최대 80px)와 홈 바 자리만큼 여유를 둔다
  const blockedRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (!blocked) return;
    const reduceMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    blockedRef.current?.scrollIntoView?.({
      block: 'nearest',
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, [blocked]);
  const blockedNoticeFor = (categories: Category[]) =>
    blocked && categories.includes(blocked.category) ? (
      <p
        ref={blockedRef}
        role="status"
        className="scroll-mb-[calc(96px+env(safe-area-inset-bottom,0px))] text-center text-xs text-[#553C9A]"
      >
        {blocked.text}
      </p>
    ) : null;

  // 문 밀기: 손가락을 댄 자리에서 움직인 거리로 판정한다. 밀어서 열고 닫은 직후의 클릭(선반 열기)은 막는다
  // 손을 뗄 때만 판정하면, 그 전에 브라우저나 앱이 손길을 가져가(pointercancel) 닫기가 사라졌다.
  // 그래서 움직이는 중에 기준을 넘으면 바로 판정한다
  const swipeRef = useRef<{
    x: number;
    y: number;
    start: DoorSwipeStart | null;
  } | null>(null);
  const swipedRef = useRef(false);
  const doorsRef = useRef<HTMLDivElement>(null);
  // 알림장은 문 위에 붙는 것(doorContent)이라 그때그때 문 안에서 찾는다
  const boardTarget = useMemo(
    () => ({
      get current() {
        return (
          doorsRef.current?.querySelector<HTMLElement>(
            '[data-guide-target="door-notes"]',
          ) ?? null
        );
      },
    }),
    [],
  );
  // 판정되면 true. 같은 손길로 두 번 판정하지 않게 부른 쪽에서 기록을 지운다
  const settleSwipe = (x: number, y: number): boolean => {
    const swipe = swipeRef.current;
    if (!swipe) return false;
    const result = doorSwipeResult(swipe.start, x - swipe.x, y - swipe.y);
    if (result === 'open' && !isOpen) {
      swipedRef.current = true;
      onOpenChange(true);
      track('fridge_doors_opened', { method: 'swipe' });
      return true;
    }
    if (result === 'close' && isOpen) {
      swipedRef.current = true;
      onOpenChange(false);
      track('fridge_doors_closed', { method: 'swipe' });
      return true;
    }
    return false;
  };
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    swipedRef.current = false;
    swipeRef.current = null;
    // 화면 끝에서 시작한 손길은 아래의 화면 전체 듣기가 맡는다 (두 번 닫히지 않게)
    if (
      isOpen &&
      event.pointerType === 'touch' &&
      screenEdgeStart(event.clientX, window.innerWidth) !== null
    ) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    swipeRef.current = {
      x: event.clientX,
      y: event.clientY,
      start: doorSwipeStart(event.clientX - rect.left, rect.width, isOpen),
    };
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (settleSwipe(event.clientX, event.clientY)) swipeRef.current = null;
  };
  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    settleSwipe(event.clientX, event.clientY);
    swipeRef.current = null;
  };

  // 문이 열려 있으면 화면 끝(냉장고 바깥 여백 포함)에서 안쪽으로 미는 손길도 받아 문을 닫는다
  // 냉장고 바깥에서 시작하면 브라우저가 곧 손길을 가져가 pointer 이벤트가 끊기므로, 스크롤 중에도 이어지는 touch 이벤트로 본다
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);
  useEffect(() => {
    if (!isOpen) return;
    let edge: { x: number; y: number; start: DoorSwipeStart } | null = null;
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      const start =
        event.touches.length === 1 && touch
          ? screenEdgeStart(touch.clientX, window.innerWidth)
          : null;
      edge =
        touch && start ? { x: touch.clientX, y: touch.clientY, start } : null;
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!edge || !touch) return;
      const result = doorSwipeResult(
        edge.start,
        touch.clientX - edge.x,
        touch.clientY - edge.y,
      );
      if (result !== 'close') return;
      edge = null;
      swipedRef.current = true;
      onOpenChangeRef.current(false);
      track('fridge_doors_closed', { method: 'edge' });
    };
    const clear = () => {
      edge = null;
    };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', clear);
    window.addEventListener('touchcancel', clear);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', clear);
      window.removeEventListener('touchcancel', clear);
    };
  }, [isOpen]);
  const onClickCapture = (event: React.MouseEvent) => {
    if (!swipedRef.current) return;
    swipedRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

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
        onClick={() => {
          setBlocked(null);
          onAddShelf(category);
        }}
        disabled={isChanging || counts[category] >= MAX_SHELF_COUNT}
        className="h-11 flex-1 rounded-xl bg-white text-xs font-semibold text-[#553C9A] shadow-[0_4px_20px_rgba(75,47,140,0.07)] ring-1 ring-black/5 disabled:opacity-40"
      >
        선반 추가
      </button>
      <button
        type="button"
        onClick={() => removeShelf(category)}
        disabled={isChanging}
        aria-disabled={!canRemove(category)}
        className={`h-11 flex-1 rounded-xl bg-white text-xs font-semibold text-[#553C9A] shadow-[0_4px_20px_rgba(75,47,140,0.07)] ring-1 ring-black/5 disabled:opacity-40 ${
          canRemove(category) ? '' : 'opacity-40'
        }`}
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
      {/* 앱이 예전 식재료를 배치해 두었거나 베타를 다시 켰으면 가운데 안내를 띄우고 뒤에서 문을 연다 */}
      {guideUserId && (
        <AutoPlaceCheck
          userId={guideUserId}
          items={items}
          onOpenDoors={() => onOpenChange(true)}
          onActiveChange={setAutoPromptActive}
        />
      )}
      {/* 세로 스크롤은 브라우저에 맡기고 가로 밀기만 받는다 */}
      <div
        ref={doorsRef}
        className="relative touch-pan-y [perspective:1400px]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          swipeRef.current = null;
        }}
        onClickCapture={onClickCapture}
        // 마우스로 식재료 그림 위에서 끌기 시작하면 브라우저가 그림 끌어 옮기기로 받아 밀기가 취소된다
        onDragStart={event => event.preventDefault()}
      >
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
          <DoorSign label="냉동실" />
          <span className="absolute top-1/2 right-3 h-36 w-1.5 -translate-y-1/2 rounded-full bg-[linear-gradient(#C9CED8,#AEB4C0)]" />
        </div>
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-y-0 right-0 w-[calc(50%-2px)] origin-right rounded-l-md rounded-r-[22px] border border-[#CBD0DA] bg-[linear-gradient(225deg,#F7F8FB_0%,#E4E7EE_100%)] transition-transform duration-1000 ease-[cubic-bezier(.25,.8,.25,1)] [backface-visibility:hidden] motion-reduce:transition-none ${
            isOpen ? '[transform:rotateY(112deg)]' : ''
          }`}
        >
          <DoorSign label="냉장실" />
          <span className="absolute top-1/2 left-3 h-36 w-1.5 -translate-y-1/2 rounded-full bg-[linear-gradient(#C9CED8,#AEB4C0)]" />
        </div>
        {!isOpen && (
          <button
            type="button"
            onClick={() => {
              onOpenChange(true);
              track('fridge_doors_opened', { method: 'button' });
            }}
            className="absolute inset-0 flex items-end justify-center rounded-[22px] pb-6"
          >
            <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[#553C9A] shadow-[0_4px_20px_rgba(75,47,140,0.12)]">
              눌러서 냉장고 열기
            </span>
          </button>
        )}
        {!isOpen && doorContent}
      </div>
      <ShelfUpdateGuide
        userId={guideUserId}
        isOpen={isOpen}
        // 밀어서 닫기, 알림장 안내는 소개와 선반 둘러보기가 끝난 뒤에 이어진다
        isBlocked={guidesBlocked || autoPromptActive || !tourDone}
        boardTarget={boardTarget}
        doorsTarget={doorsRef}
        onOpenBoard={() => boardTarget.current?.click()}
        onCloseDoors={() => {
          onOpenChange(false);
          track('fridge_doors_closed', { method: 'button' });
        }}
      />
      {/* 선반 둘러보기 1장: 냉장실 1번 선반을 비추고 열어 보게 한다 (2~7장은 선반 목록에서) */}
      <ShelfTourStart
        userId={guideUserId}
        isOpen={isOpen}
        isBlocked={guidesBlocked || autoPromptActive}
        doorsRef={doorsRef}
        onOpenDoors={() => onOpenChange(true)}
        onOpenFirstShelf={() => open('fridge', 1)}
      />

      {isOpen && (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            {controls('freezer')}
            {controls('fridge')}
          </div>
          {blockedNoticeFor(['freezer', 'fridge'])}
          <ShelfColumn
            category="pantry"
            count={counts.pantry}
            items={byCategory('pantry')}
            onOpen={shelf => open('pantry', shelf)}
          />
          {controls('pantry')}
          {blockedNoticeFor(['pantry'])}
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
