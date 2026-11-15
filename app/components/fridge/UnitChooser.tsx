'use client';
// app/components/fridge/UnitChooser.tsx
// 수량 칸 옆의 단위 고르기. 누르면 마트 단위 칩(개, 구, 모, 단 ... g)이 펼쳐진다
// - 고르지 않았으면 이름으로 추정한 단위가 보이고, 그 칩에 "추천"이 붙는다
// - 개수와 g 사이를 오가면 수량을 새로 채운다 (1개 또는 500g)
// - 이미 먹은 기록이 있으면 먹은 양의 뜻이 바뀌므로 단위를 바꾸지 않는다

import React, { useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { track } from '@/app/lib/analytics/gtag';
import {
  quantityAfterUnitChange,
  suggestedUnit,
  UNIT_CHOICES,
  unitFor,
  type Unit,
} from '@/app/lib/items/units';

interface UnitChooserProps {
  name: string;
  unit: string | null;
  quantity: number;
  eatenQuantity: number;
  onChange: (change: { unit: Unit; quantity: number }) => void;
}

const UnitChooser: React.FC<UnitChooserProps> = ({
  name,
  unit,
  quantity,
  eatenQuantity,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const current = unitFor(name, unit);
  const suggested = suggestedUnit(name);
  const locked = eatenQuantity > 0;

  const choose = (next: Unit) => {
    setIsOpen(false);
    if (next === current && unit !== null) return;
    onChange({
      unit: next,
      quantity: quantityAfterUnitChange(current, next, quantity),
    });
    track('item_unit_set', { unit: next, suggested: next === suggested });
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        aria-expanded={isOpen}
        aria-label={`${name} 단위 ${current}, 바꾸기`}
        className="flex h-10 items-center gap-0.5 rounded-xl bg-[#F4F4F8] px-2.5 text-sm font-semibold text-gray-700 active:bg-gray-200"
      >
        {current}
        <ChevronDownIcon size={14} className="text-gray-400" />
      </button>
      {isOpen && (
        <div className="absolute top-11 right-0 z-20 w-64 rounded-2xl bg-white p-2 shadow-[0_8px_30px_rgba(31,26,46,0.18)] ring-1 ring-black/5">
          {locked ? (
            <p className="p-2 text-xs text-gray-500">
              먹은 기록이 있어 단위를 바꿀 수 없어요
            </p>
          ) : (
            <div className="grid grid-cols-5 gap-1">
              {UNIT_CHOICES.map(choice => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => choose(choice)}
                  aria-pressed={choice === current}
                  className={`relative h-11 rounded-lg text-sm font-semibold ${
                    choice === current
                      ? 'bg-[#6B46C1] text-white'
                      : 'bg-[#F4F4F8] text-gray-700 active:bg-gray-200'
                  }`}
                >
                  {choice}
                  {choice === suggested && choice !== current && (
                    <span className="absolute -top-1 -right-1 rounded-full bg-[#E6DFF7] px-1 text-[9px] text-[#553C9A]">
                      추천
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UnitChooser;
