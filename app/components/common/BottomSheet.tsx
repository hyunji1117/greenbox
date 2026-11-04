'use client';
// app/components/common/BottomSheet.tsx
// 아래에서 올라오는 시트. 휴대폰에서는 화면 아래에 붙고, 넓은 화면에서는 가운데에 뜬다
// 바깥을 누르거나 Esc를 누르면 닫힌다

import React, { useEffect, useId } from 'react';
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

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="motion-safe:animate-tab-fade max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-[#F2F2F6] p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:max-w-md md:rounded-3xl"
        onClick={event => event.stopPropagation()}
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
