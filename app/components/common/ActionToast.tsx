// app/components/common/ActionToast.tsx
// 버튼이 있는 하단 안내. 하단 메뉴를 가리지 않도록 그 위에 띄운다
// 나타나고 사라지는 전환을 위해 항상 그려 두고 표시 여부만 바꾼다

import React from 'react';

interface ActionToastProps {
  isVisible: boolean;
  subject?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const ActionToast: React.FC<ActionToastProps> = ({
  isVisible,
  subject,
  message,
  actionLabel,
  onAction,
}) => (
  <div
    role="status"
    inert={!isVisible}
    className={`fixed inset-x-4 bottom-24 z-50 mx-auto flex min-h-14 max-w-md items-center justify-between gap-3 rounded-2xl bg-gray-900 px-4 py-2 text-sm text-white shadow-lg transition-[opacity,translate] duration-300 ease-out motion-reduce:transition-none ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
    }`}
  >
    <span className="flex min-w-0 gap-1">
      {subject && (
        <span className="min-w-0 truncate font-medium">{subject}</span>
      )}
      <span className={subject ? 'shrink-0' : undefined}>{message}</span>
    </span>
    {actionLabel && (
      <button
        type="button"
        onClick={onAction}
        className="h-10 shrink-0 rounded-xl px-3 font-semibold text-[#C4B5FD] transition-colors hover:bg-white/10"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default ActionToast;
