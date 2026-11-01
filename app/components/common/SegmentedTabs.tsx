// app/components/common/SegmentedTabs.tsx
// 선택 표시가 칸 사이를 미끄러지듯 움직이는 탭. 칸 수는 4개까지 지원한다

import React from 'react';
import type { LucideIcon } from 'lucide-react';

export const SURFACE =
  'rounded-2xl bg-white shadow-[0_4px_20px_rgba(75,47,140,0.07)] ring-1 ring-black/5';

const GRID_COLUMNS = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
} as const;
const INDICATOR_WIDTH = {
  2: 'w-[calc((100%-0.75rem)/2)]',
  3: 'w-[calc((100%-1rem)/3)]',
  4: 'w-[calc((100%-1.25rem)/4)]',
} as const;

interface SegmentedTabsProps<T extends string> {
  tabs: ReadonlyArray<{ id: T; label: string; Icon?: LucideIcon }> & {
    length: 2 | 3 | 4;
  };
  activeId: T;
  onChange: (id: T) => void;
  className?: string;
}

function SegmentedTabs<T extends string>({
  tabs,
  activeId,
  onChange,
  className = '',
}: SegmentedTabsProps<T>) {
  const activeIndex = tabs.findIndex(tab => tab.id === activeId);
  return (
    <div
      className={`relative grid gap-1 p-1 ${GRID_COLUMNS[tabs.length]} ${SURFACE} ${className}`}
    >
      {/* 선택 표시는 하나만 두고 위치만 옮긴다 (4px는 칸 사이 간격) */}
      <span
        aria-hidden
        className={`absolute top-1 bottom-1 left-1 rounded-xl bg-[#6B46C1] transition-transform duration-300 ease-out motion-reduce:transition-none ${INDICATOR_WIDTH[tabs.length]}`}
        style={{
          transform: `translateX(calc(${activeIndex} * (100% + 4px)))`,
        }}
      />
      {tabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-pressed={activeId === id}
          className={`relative flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl text-sm font-medium transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-[#C4B5FD] focus-visible:outline-none focus-visible:ring-inset motion-reduce:transition-none ${
            activeId === id ? 'text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {Icon && <Icon size={18} className="shrink-0" />}
          {label}
        </button>
      ))}
    </div>
  );
}

export default SegmentedTabs;
