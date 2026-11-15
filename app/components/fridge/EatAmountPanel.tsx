'use client';
// app/components/fridge/EatAmountPanel.tsx
// "먹음"을 눌렀을 때 얼마나 먹었는지 고르는 줄. 냉장고 카드와 선반 목록이 같은 모양으로 쓴다
// - 개수 단위: 1씩 움직이는 수량 칸
// - g 단위: 100g씩 움직이고, 숫자를 바로 적거나 [반]을 눌러 남은 양의 절반을 고른다
// 남은 만큼 이상을 고르면 "모두 먹음"으로 바뀐다

import React from 'react';
import QuantityStepper from '@/app/components/common/QuantityStepper';
import { isGram, quantityLimits } from '@/app/lib/items/units';

// 처음 펼칠 때 고를 양: 개수는 1, g은 100g (남은 양이 더 적으면 남은 양)
export function initialEatAmount(unit: string, remaining: number): number {
  return Math.min(quantityLimits(unit).step, remaining);
}

interface EatAmountPanelProps {
  itemName: string;
  unit: string;
  remaining: number;
  value: number;
  onChange: (value: number) => void;
  onConfirm: () => void;
  className?: string;
}

const EatAmountPanel: React.FC<EatAmountPanelProps> = ({
  itemName,
  unit,
  remaining,
  value,
  onChange,
  onConfirm,
  className = '',
}) => {
  const gram = isGram(unit);
  const half = Math.max(1, Math.round(remaining / 2));
  return (
    <div
      className={`flex flex-wrap items-center gap-2 bg-[#F8F6FD] ${className}`}
    >
      <span className="min-w-0 flex-1 text-sm font-medium text-gray-700">
        {gram ? '얼마나 먹었어요?' : `몇 ${unit} 먹었어요?`}
      </span>
      {gram && remaining > 1 && (
        <button
          type="button"
          onClick={() => onChange(half)}
          aria-pressed={value === half}
          className={`h-10 shrink-0 rounded-lg px-3 text-sm font-semibold ring-1 ring-black/5 ${
            value === half
              ? 'bg-[#E6DFF7] text-[#553C9A]'
              : 'bg-white text-gray-700'
          }`}
        >
          반
        </button>
      )}
      <QuantityStepper
        value={value}
        onChange={onChange}
        label={gram ? `${itemName} 먹은 양` : `${itemName} 먹은 개수`}
        max={remaining}
        tone="white"
        unit={unit}
        step={quantityLimits(unit).step}
      />
      <button
        type="button"
        onClick={onConfirm}
        className="h-10 shrink-0 rounded-lg bg-[#6B46C1] px-3 text-sm font-semibold text-white transition-colors hover:bg-[#603fad]"
      >
        {value >= remaining ? '모두 먹음' : `${value}${unit} 먹음`}
      </button>
    </div>
  );
};

export default EatAmountPanel;
