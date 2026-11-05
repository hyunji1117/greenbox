'use client';
// app/components/fridge/sharing/SwitchGuide.tsx
// 처음 초대받은 냉장고가 생겼을 때 한 번 보여 주는 안내
// 배경을 어둡게 하고 냉장고 이름만 밝게 비춰 "여기를 누르면 냉장고를 바꿀 수 있다"는 것을 알린다

import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

interface SwitchGuideProps {
  target: React.RefObject<HTMLElement | null>;
  onTryIt: () => void;
  onClose: () => void;
}

const SPOTLIGHT_PADDING = 6;

const SwitchGuide: React.FC<SwitchGuideProps> = ({
  target,
  onTryIt,
  onClose,
}) => {
  const titleId = useId();
  const primaryRef = useRef<HTMLButtonElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // 화면 크기가 바뀌거나 스크롤돼도 비추는 자리가 이름 위에 있게 한다
  useLayoutEffect(() => {
    const measure = () =>
      setRect(target.current?.getBoundingClientRect() ?? null);
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [target]);

  useEffect(() => {
    primaryRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (!rect) return null;

  const spot = {
    top: rect.top - SPOTLIGHT_PADDING,
    left: rect.left - SPOTLIGHT_PADDING,
    width: rect.width + SPOTLIGHT_PADDING * 2,
    height: rect.height + SPOTLIGHT_PADDING * 2,
  };

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
        onClick={onClose}
      />
      {/* 이름만 밝게 남기고 나머지를 어둡게 덮는다. 비춘 자리를 누르면 바로 바꾸기 화면을 연다 */}
      <button
        type="button"
        aria-label="냉장고 바꾸기 열기"
        onClick={onTryIt}
        className="absolute rounded-xl shadow-[0_0_0_9999px_rgba(17,12,34,0.55)] ring-2 ring-white/80"
        style={spot}
      />
      <div
        className="absolute right-4 left-4 max-w-sm rounded-2xl bg-white p-4 shadow-xl"
        style={{ top: spot.top + spot.height + 12 }}
      >
        <h2 id={titleId} className="font-semibold text-gray-900">
          함께 보는 냉장고가 생겼어요
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">
          위의 냉장고 이름을 누르면 내 냉장고와 초대받은 냉장고를 바꿔 가며 볼
          수 있어요.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            ref={primaryRef}
            type="button"
            onClick={onTryIt}
            className="h-10 flex-1 rounded-xl bg-[#6B46C1] text-sm font-medium text-white"
          >
            바꿔 보기
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-xl bg-[#F4F4F8] text-sm font-medium text-gray-700"
          >
            알겠어요
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default SwitchGuide;
