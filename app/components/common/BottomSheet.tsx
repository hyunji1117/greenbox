'use client';
// app/components/common/BottomSheet.tsx
// 아래에서 올라오는 시트. 휴대폰에서는 화면 아래에 붙고, 넓은 화면에서는 가운데에 뜬다
// 바깥을 누르거나 Esc를 누르면 닫힌다. 열리고 닫힐 때 배경은 서서히, 시트는 미끄러지듯 움직인다

import React, { useEffect, useId, useState } from 'react';
import { XIcon } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  title,
  onClose,
  children,
}) => {
  const titleId = useId();
  // 닫는 동안에도 내려가는 모습을 보여 주기 위해, 닫힘 애니메이션이 끝날 때까지 화면에 남겨 둔다
  const [isRendered, setIsRendered] = useState(isOpen);
  if (isOpen && !isRendered) setIsRendered(true);
  const isClosing = isRendered && !isOpen;

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isRendered) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center md:items-center ${
        isClosing ? 'pointer-events-none' : ''
      }`}
      onClick={onClose}
    >
      {/* 배경은 시트와 따로 서서히 어두워져, 열릴 때 화면 전체가 한 번에 깜빡이지 않게 한다 */}
      <div
        aria-hidden
        className={`absolute inset-0 bg-black/40 ${
          isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        // 휴대폰은 아래에서 올라오고, 넓은 화면은 가운데에서 살짝 떠오른다
        // 움직임 줄이기 설정이면 위치는 그대로 두고 투명도만 바꾼다
        className={`relative max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-[#F2F2F6] p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] will-change-transform md:max-w-md md:rounded-3xl ${
          isClosing
            ? 'animate-sheet-down md:animate-dialog-out motion-reduce:animate-backdrop-out'
            : 'animate-sheet-up md:animate-dialog-in motion-reduce:animate-backdrop-in'
        }`}
        onClick={event => event.stopPropagation()}
        onAnimationEnd={event => {
          // 시트 안의 다른 애니메이션이 끝난 것은 무시한다
          if (event.target === event.currentTarget && isClosing) {
            setIsRendered(false);
          }
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-black/5"
          >
            <XIcon size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default BottomSheet;
