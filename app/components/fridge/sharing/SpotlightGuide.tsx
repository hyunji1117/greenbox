'use client';
// app/components/fridge/sharing/SpotlightGuide.tsx
// 배경을 살짝 어둡게 하고 화면의 한 곳만 밝게 비춰 "여기를 누르면 무엇을 할 수 있는지" 알리는 안내
// 냉장고 바꾸기 안내와 함께 보는 사람 안내가 함께 쓴다

import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { track, type GuideName } from '@/app/lib/analytics/gtag';

interface SpotlightGuideProps {
  // 측정용 안내 이름. 보였는지, 어느 버튼을 눌렀는지 GA에 남긴다
  guide: GuideName;
  // 밝게 비출 화면 요소
  target: React.RefObject<HTMLElement | null>;
  title: string;
  body: React.ReactNode;
  // 비춘 자리와 첫 번째 버튼을 누르면 하는 일
  primaryLabel: string;
  spotLabel: string;
  onPrimary: () => void;
  onClose: () => void;
  closeLabel?: string;
  // 비추는 자리의 모서리. 둥근 버튼을 비출 때는 rounded-full
  spotShape?: 'rounded-xl' | 'rounded-full';
  // 함께 밝게 비출 곳 (예: 하단 메뉴의 마이 탭). CSS 선택자로 찾는다
  alsoHighlight?: string;
}

const SPOTLIGHT_PADDING = 6;

const SpotlightGuide: React.FC<SpotlightGuideProps> = ({
  guide,
  target,
  title,
  body,
  primaryLabel,
  spotLabel,
  onPrimary,
  onClose,
  closeLabel = '알겠어요',
  spotShape = 'rounded-xl',
  alsoHighlight,
}) => {
  const titleId = useId();
  const handlePrimary = () => {
    track('guide_action', { guide, action: 'primary' });
    onPrimary();
  };
  const handleClose = useCallback(() => {
    track('guide_action', { guide, action: 'close' });
    onClose();
  }, [guide, onClose]);

  useEffect(() => {
    track('guide_shown', { guide });
  }, [guide]);

  const primaryRef = useRef<HTMLButtonElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [extraRect, setExtraRect] = useState<DOMRect | null>(null);

  // 화면 크기가 바뀌거나 스크롤돼도 비추는 자리가 이름 위에 있게 한다
  useLayoutEffect(() => {
    const measure = () => {
      setRect(target.current?.getBoundingClientRect() ?? null);
      setExtraRect(
        alsoHighlight
          ? (document
              .querySelector<HTMLElement>(alsoHighlight)
              ?.getBoundingClientRect() ?? null)
          : null,
      );
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [target, alsoHighlight]);

  useEffect(() => {
    primaryRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClose]);

  if (!rect) return null;

  const toSpot = (r: DOMRect) => ({
    top: r.top - SPOTLIGHT_PADDING,
    left: r.left - SPOTLIGHT_PADDING,
    width: r.width + SPOTLIGHT_PADDING * 2,
    height: r.height + SPOTLIGHT_PADDING * 2,
  });
  const spot = toSpot(rect);
  const extraSpot = extraRect ? toSpot(extraRect) : null;
  const radius = spotShape === 'rounded-full' ? spot.height / 2 : 12;
  const maskId = `spot-mask-${titleId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="motion-safe:animate-tab-fade fixed inset-0 z-[60]"
    >
      {/* 바깥을 누르면 닫는다 */}
      <button
        type="button"
        aria-label="안내 닫기"
        className="absolute inset-0 cursor-default"
        onClick={handleClose}
      />
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
        className={`absolute ${spotShape} ring-2 ring-white/80`}
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
        className="absolute right-4 left-4 max-w-sm rounded-2xl bg-white p-4 shadow-xl"
        style={{ top: spot.top + spot.height + 12 }}
      >
        <h2 id={titleId} className="font-semibold text-gray-900">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">{body}</p>
        <div className="mt-3 flex gap-2">
          <button
            ref={primaryRef}
            type="button"
            onClick={handlePrimary}
            className="h-10 flex-1 rounded-xl bg-[#6B46C1] text-sm font-medium text-white"
          >
            {primaryLabel}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="h-10 flex-1 rounded-xl bg-[#F4F4F8] text-sm font-medium text-gray-700"
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default SpotlightGuide;
