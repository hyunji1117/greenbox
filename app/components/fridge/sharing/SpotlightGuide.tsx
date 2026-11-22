'use client';
// app/components/fridge/sharing/SpotlightGuide.tsx
// 배경을 살짝 어둡게 하고 화면의 한 곳만 밝게 비춰 "여기를 누르면 무엇을 할 수 있는지" 알리는 안내
// 냉장고 바꾸기 안내, 함께 보는 사람 안내, 선반 보기 안내(알림장, 밀어서 닫기)가 함께 쓴다
// - 띄우고 싶은 안내는 이 컴포넌트를 그리기만 하면 줄을 선다. 한 번에 하나씩, 정해 둔 순서(GUIDE_ORDER)대로 보인다
// - 뒤에 기다리는 안내가 있으면 오른쪽 버튼이 "다음", 마지막 안내는 "시작하기"
// - 어두운 바깥을 눌러도 넘어가지 않는다. 상자 안 버튼(또는 키보드 Esc)으로만 넘긴다

import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { track, type GuideName } from '@/app/lib/analytics/gtag';

interface SpotlightGuideProps {
  // 측정용 안내 이름. 보였는지, 어느 버튼을 눌렀는지 GA에 남긴다
  guide: GuideName;
  // 밝게 비출 화면 요소
  target: React.RefObject<HTMLElement | null>;
  title: string;
  // 제목 아래 설명. 없으면 제목만 둔다 (둘러보기처럼 큰 제목 한 줄로 충분할 때)
  body?: React.ReactNode;
  // 비춘 자리와 첫 번째 버튼을 누르면 하는 일. 없으면 버튼을 하나만 두고, 비춘 자리를 눌러도 넘어간다
  primaryLabel?: string;
  spotLabel: string;
  onPrimary?: () => void;
  // "다음" 또는 "시작하기"를 누르면 하는 일 (본 것으로 기억하고 닫는다)
  onClose: () => void;
  // 오른쪽(또는 하나뿐인) 버튼 글자를 정해 둘 때. 없으면 뒤에 안내가 있는지에 따라 다음/시작하기
  closeLabel?: string;
  // 버튼 없이 비춘 자리를 직접 눌러 보게 할 때 ("선반 선택해요"). 비춘 자리에 깜빡이는 보라 테두리를 둔다
  tapSpotOnly?: boolean;
  // 나타날 때 서서히 어두워지는 효과. 이어지는 둘러보기의 두 번째 장부터는 끄고 바로 바꾼다 (깜빡이지 않게)
  fadeIn?: boolean;
  // 제목 앞에 붙이는 표시 ("가이드"). NEW, 추천 배지와 같은 진한 보라 바탕에 흰 글자, 제목과 같은 크기
  // (굵기는 한 단계 낮춰 제목보다 먼저 눈에 들어오지 않게)
  badge?: string;
  // 비추는 자리의 모서리. 둥근 버튼을 비출 때는 rounded-full
  spotShape?: 'rounded-xl' | 'rounded-full';
  // 함께 밝게 비출 곳 (예: 하단 메뉴의 마이 탭). CSS 선택자로 찾는다
  alsoHighlight?: string;
}

const SPOTLIGHT_PADDING = 6;
// 뜬 직후 비출 곳을 따라가며 다시 재는 시간 (시트가 올라오고 문이 열리는 움직임보다 조금 길게)
const FOLLOW_MOVING_MS = 1200;
const CARD_GAP = 12;
const SCREEN_MARGIN = 16;

// 안내 순서. 서로 다른 화면 조각(위쪽 머리말, 냉장고)에서 띄우는 안내가 겹치지 않게 한 줄로 세운다
export const GUIDE_ORDER: Record<GuideName, number> = {
  fridge_switch: 10,
  members_count: 20,
  owner_members: 30,
  shelf_board: 40,
  door_swipe: 50,
  shelf_tour: 60,
};

// 줄의 맨 앞이 지금 보이는 안내다. 한 번 보이기 시작한 안내는 순서가 앞선 안내가 늦게 와도 닫힐 때까지 맨 앞에 둔다
let queue: GuideName[] = [];
let pinned: GuideName | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(listener => listener());

function joinQueue(name: GuideName) {
  if (queue.includes(name)) return;
  const head = pinned && queue[0] === pinned ? [pinned] : [];
  const rest = [...queue.slice(head.length), name].sort(
    (a, b) => GUIDE_ORDER[a] - GUIDE_ORDER[b],
  );
  queue = [...head, ...rest];
  emit();
}

function leaveQueue(name: GuideName) {
  if (!queue.includes(name)) return;
  queue = queue.filter(entry => entry !== name);
  if (pinned === name) pinned = null;
  emit();
}

function pinHead(name: GuideName) {
  if (queue[0] === name) pinned = name;
}

function useGuideQueue(): GuideName[] {
  return useSyncExternalStore(
    listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => queue,
    () => queue,
  );
}

// 다른 안내가 떠 있거나 기다리는지 (화면 가운데 안내 같은 것이 겹치지 않게 기다릴 때 쓴다)
export function useIsGuideQueued(): boolean {
  return useGuideQueue().length > 0;
}

// 테스트에서 줄을 비운다
export function resetGuideQueueForTest() {
  queue = [];
  pinned = null;
}

const SpotlightGuide: React.FC<SpotlightGuideProps> = ({
  guide,
  target,
  title,
  body,
  primaryLabel,
  spotLabel,
  onPrimary,
  onClose,
  spotShape = 'rounded-xl',
  alsoHighlight,
  closeLabel,
  tapSpotOnly = false,
  badge,
  fadeIn = true,
}) => {
  const titleId = useId();
  const singleButton = !primaryLabel || !onPrimary;
  const handlePrimary = () => {
    if (singleButton) {
      // 버튼 하나짜리 안내: 비춘 자리를 직접 누르게 한 안내만 넘어가고, "다음" 버튼이 있으면 그 버튼으로만 넘어간다
      if (tapSpotOnly) handleClose();
      return;
    }
    track('guide_action', { guide, action: 'primary' });
    onPrimary?.();
  };
  const handleClose = useCallback(() => {
    track('guide_action', { guide, action: 'close' });
    onClose();
  }, [guide, onClose]);

  const guideQueue = useGuideQueue();
  const isMyTurn = guideQueue[0] === guide;
  const hasNext = isMyTurn && guideQueue.length > 1;
  useEffect(() => {
    joinQueue(guide);
    return () => leaveQueue(guide);
  }, [guide]);
  useEffect(() => {
    if (!isMyTurn) return;
    pinHead(guide);
    track('guide_shown', { guide });
  }, [guide, isMyTurn]);

  const primaryRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [extraRect, setExtraRect] = useState<DOMRect | null>(null);

  // 화면 크기가 바뀌거나 스크롤돼도 비추는 자리가 이름 위에 있게 한다
  useLayoutEffect(() => {
    // 자리가 그대로면 다시 그리지 않는다 (움직임을 따라 매 화면 잴 때 쓸데없이 그리지 않게)
    const same = (a: DOMRect | null, b: DOMRect | null) =>
      a === b ||
      (a !== null &&
        b !== null &&
        a.top === b.top &&
        a.left === b.left &&
        a.width === b.width &&
        a.height === b.height);
    const measure = () => {
      const next = target.current?.getBoundingClientRect() ?? null;
      setRect(prev => (same(prev, next) ? prev : next));
      const nextExtra = alsoHighlight
        ? (document
            .querySelector<HTMLElement>(alsoHighlight)
            ?.getBoundingClientRect() ?? null)
        : null;
      setExtraRect(prev => (same(prev, nextExtra) ? prev : nextExtra));
    };
    measure();
    // 비출 곳이 움직이는 중일 수 있다 (아래에서 올라오는 시트, 열리는 냉장고 문).
    // 뜬 직후 잠깐은 화면이 그려질 때마다 다시 재고, 움직임이 끝날 때도 다시 잰다
    // (시트가 올라오는 도중에 잰 자리에 그대로 남아 엉뚱한 곳을 비췄다, 2026-11-20)
    let frame = 0;
    const startedAt = performance.now();
    const follow = () => {
      measure();
      if (performance.now() - startedAt < FOLLOW_MOVING_MS) {
        frame = requestAnimationFrame(follow);
      }
    };
    frame = requestAnimationFrame(follow);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    document.addEventListener('animationend', measure, true);
    document.addEventListener('transitionend', measure, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      document.removeEventListener('animationend', measure, true);
      document.removeEventListener('transitionend', measure, true);
    };
  }, [target, alsoHighlight]);

  // 설명 상자 크기는 그려진 뒤에 잰다 (글 길이와 화면 폭에 따라 다르다)
  useLayoutEffect(() => {
    const height = cardRef.current?.offsetHeight ?? 0;
    const width = cardRef.current?.offsetWidth ?? 0;
    if (height !== cardHeight) setCardHeight(height);
    if (width !== cardWidth) setCardWidth(width);
  }, [rect, cardHeight, cardWidth, isMyTurn]);

  const hasRect = rect !== null;
  useEffect(() => {
    if (!isMyTurn || !hasRect) return;
    primaryRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClose, isMyTurn, hasRect]);

  if (!isMyTurn || !rect) return null;

  const toSpot = (r: DOMRect) => ({
    top: r.top - SPOTLIGHT_PADDING,
    left: r.left - SPOTLIGHT_PADDING,
    width: r.width + SPOTLIGHT_PADDING * 2,
    height: r.height + SPOTLIGHT_PADDING * 2,
  });
  const spot = toSpot(rect);
  const extraSpot = extraRect ? toSpot(extraRect) : null;
  const radius = spotShape === 'rounded-full' ? spot.height / 2 : 12;
  // 설명 상자는 비춘 자리 아래에 두고, 아래에 자리가 없으면 위에, 위에도 없으면(냉장고처럼 큰 자리) 화면 아래쪽 안에 둔다
  const below = spot.top + spot.height + CARD_GAP;
  const above = spot.top - CARD_GAP - cardHeight;
  const screenHeight = window.innerHeight;
  const cardTop =
    below + cardHeight <= screenHeight - SCREEN_MARGIN
      ? below
      : above >= SCREEN_MARGIN
        ? above
        : Math.max(SCREEN_MARGIN, screenHeight - SCREEN_MARGIN - cardHeight);
  // 가로는 비춘 자리의 가운데에 맞추되 화면 양옆 16px 안쪽에 둔다
  const screenWidth = window.innerWidth;
  const cardLeft = Math.min(
    Math.max(SCREEN_MARGIN, spot.left + spot.width / 2 - cardWidth / 2),
    Math.max(SCREEN_MARGIN, screenWidth - SCREEN_MARGIN - cardWidth),
  );
  const maskId = `spot-mask-${titleId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={`fixed inset-0 z-[60] ${fadeIn ? 'motion-safe:animate-tab-fade' : ''}`}
    >
      {/* 바깥을 눌러도 넘어가지 않게 뒤 화면 누르기만 막는다 (실수로 안내를 지나치지 않게) */}
      <div aria-hidden className="absolute inset-0" />
      {/* 비출 곳(한 곳 또는 두 곳)만 구멍을 내고 나머지를 어둡게 덮는다 */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={spot.left}
              y={spot.top}
              width={spot.width}
              height={spot.height}
              rx={radius}
              fill="black"
            />
            {extraSpot && (
              <rect
                x={extraSpot.left}
                y={extraSpot.top}
                width={extraSpot.width}
                height={extraSpot.height}
                rx={20}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(17,12,34,0.55)"
          mask={`url(#${maskId})`}
        />
      </svg>
      {/* 비춘 자리를 누르면 바로 그 기능을 연다 */}
      <button
        type="button"
        aria-label={spotLabel}
        onClick={handlePrimary}
        className={`absolute ${spotShape} ${
          tapSpotOnly
            ? 'ring-[3px] ring-[#A78BFA] motion-safe:animate-pulse'
            : 'ring-2 ring-white/80'
        }`}
        style={spot}
      />
      {extraSpot && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={handlePrimary}
          className="absolute rounded-[20px] ring-2 ring-white/90 motion-safe:animate-pulse"
          style={extraSpot}
        />
      )}
      <div
        ref={cardRef}
        // 폭은 글 길이에 맞춘다. 가장 넓을 때는 예전 상자 폭(화면 양옆 16px, 최대 384px),
        // 가장 좁을 때도 버튼 두 개가 들어가는 256px은 둔다. 글은 가운데 정렬
        // 버튼이 두 개일 때만 두 버튼이 들어가는 최소 폭(256px)을 둔다. 버튼이 하나거나 없으면 글 길이에 맞춘다
        className={`absolute w-max max-w-[min(24rem,calc(100vw-2rem))] rounded-2xl bg-white p-4 text-center shadow-xl ${
          !tapSpotOnly && !singleButton ? 'min-w-64' : ''
        }`}
        style={{ top: cardTop, left: cardLeft }}
      >
        {/* 긴 제목은 제목 안의 줄바꿈(\n)에서 나눈다. 글자 수로 아무 데서나 끊기면 "수 / 있어요"처럼 어색했다 (2026-11-22)
            "가이드" 배지는 줄 수와 상관없이 첫 줄 앞에 둔다 (한 줄 제목과 같은 자리, 줄마다 가운데 정렬 유지) */}
        <h2
          id={titleId}
          className="font-semibold whitespace-pre-line text-gray-900"
        >
          {badge && (
            <span
              aria-hidden
              className="mr-1.5 inline-block rounded-lg bg-[#6B46C1] px-1.5 font-medium text-white"
            >
              {badge}
            </span>
          )}
          {title}
        </h2>
        {body && (
          <p className="mt-1 text-sm leading-relaxed text-gray-600">{body}</p>
        )}
        {!tapSpotOnly && (
          <div className="mt-3 flex gap-2">
            {!singleButton && (
              <button
                ref={primaryRef}
                type="button"
                onClick={handlePrimary}
                className="h-10 flex-1 rounded-xl bg-[#6B46C1] text-sm font-medium text-white"
              >
                {primaryLabel}
              </button>
            )}
            <button
              ref={singleButton ? primaryRef : undefined}
              type="button"
              onClick={handleClose}
              className={`h-10 flex-1 rounded-xl text-sm font-medium ${
                singleButton
                  ? 'bg-[#6B46C1] text-white'
                  : 'bg-[#F4F4F8] text-gray-700'
              }`}
            >
              {closeLabel ?? (hasNext ? '다음' : '시작하기')}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default SpotlightGuide;
