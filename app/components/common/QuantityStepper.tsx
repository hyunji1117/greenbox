'use client';
// app/components/common/QuantityStepper.tsx
// 수량 칸: 빼기와 더하기 버튼, 가운데 숫자는 눌러서 직접 적는다 (계란 30개처럼 많이 살 때)
// 냉장고 카드, 장보기 리스트, 식재료 담기, 먹은 개수 고르기에서 같은 모양과 동작으로 쓴다
// - iOS Safari는 16px 미만 입력창을 누르면 화면을 확대하므로 글자는 16px(text-base)로 둔다
// - 적는 동안은 저장하지 않고, 칸을 벗어나거나 완료를 누를 때 범위 안으로 맞춰 한 번 저장한다
// - 버튼 색은 누르는 동안만 진하게 한다 (마우스 올림 색은 휴대폰에서 누른 뒤에도 남아 보일 수 있다)

import React, { useState } from 'react';
import { MinusIcon, PlusIcon } from 'lucide-react';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  // 화면 읽기 프로그램에 읽힐 품목 이름 (예: "계란 수량")
  label: string;
  min?: number;
  max: number;
  size?: 'md' | 'sm';
  // 카드 위에 겹쳐 보일 때처럼 흰 바탕이 필요한 곳
  tone?: 'gray' | 'white';
}

const SIZE = {
  md: { box: 'h-10', button: 'h-10 w-9', input: 'w-9', icon: 16 },
  sm: { box: 'h-9', button: 'h-9 w-8', input: 'w-8', icon: 14 },
} as const;

export function clampQuantity(text: string, min: number, max: number) {
  const parsed = Number.parseInt(text, 10);
  if (Number.isNaN(parsed)) return null;
  return Math.min(max, Math.max(min, parsed));
}

const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  onChange,
  label,
  min = 1,
  max,
  size = 'md',
  tone = 'gray',
}) => {
  // 적는 중인 글자. 없으면 저장된 값을 보여 준다
  const [draft, setDraft] = useState<string | null>(null);
  const s = SIZE[size];

  const commit = () => {
    if (draft === null) return;
    const next = clampQuantity(draft, min, max);
    setDraft(null);
    if (next !== null && next !== value) onChange(next);
  };

  const step = (delta: number) => {
    const next = Math.min(max, Math.max(min, value + delta));
    setDraft(null);
    if (next !== value) onChange(next);
  };

  return (
    <div
      className={`flex shrink-0 items-center rounded-xl text-gray-700 ${s.box} ${
        tone === 'white'
          ? 'bg-white shadow-md ring-1 ring-black/5'
          : 'bg-[#F4F4F8]'
      }`}
    >
      <button
        type="button"
        onClick={() => step(-1)}
        aria-label={`${label} 줄이기`}
        disabled={value <= min}
        className={`flex items-center justify-center rounded-l-xl transition-colors active:bg-gray-200 disabled:opacity-30 ${s.button}`}
      >
        <MinusIcon size={s.icon} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        enterKeyHint="done"
        aria-label={label}
        value={draft ?? String(value)}
        onFocus={event => event.currentTarget.select()}
        onChange={event =>
          setDraft(event.target.value.replace(/\D/g, '').slice(0, 2))
        }
        onBlur={commit}
        onKeyDown={event => {
          if (event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') {
            setDraft(null);
            event.currentTarget.blur();
          }
        }}
        className={`h-full bg-transparent text-center text-base font-semibold tabular-nums focus:rounded-md focus:bg-white focus:ring-1 focus:ring-[#A794D6] focus:outline-none ${s.input}`}
      />
      <button
        type="button"
        onClick={() => step(1)}
        aria-label={`${label} 늘리기`}
        disabled={value >= max}
        className={`flex items-center justify-center rounded-r-xl transition-colors active:bg-gray-200 disabled:opacity-30 ${s.button}`}
      >
        <PlusIcon size={s.icon} />
      </button>
    </div>
  );
};

export default QuantityStepper;
