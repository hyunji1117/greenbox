'use client';
// app/components/auth/ConsentChecklist.tsx
// 개인정보 동의 체크리스트. 방침 원문은 화면 맨 아래 링크 하나로 연다 (같은 화면을 가리키는 링크를 두 번 두지 않는다)

import React from 'react';
import { CONSENT_ITEMS, type ConsentType } from '@/app/lib/consent/policies';

interface ConsentChecklistProps {
  value: ConsentType[];
  onChange: (next: ConsentType[]) => void;
}

const ConsentChecklist: React.FC<ConsentChecklistProps> = ({
  value,
  onChange,
}) => {
  const allChecked = CONSENT_ITEMS.every(i => value.includes(i.type));

  const toggle = (type: ConsentType) => {
    onChange(
      value.includes(type) ? value.filter(t => t !== type) : [...value, type],
    );
  };

  const toggleAll = () => {
    onChange(allChecked ? [] : CONSENT_ITEMS.map(i => i.type));
  };

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <label className="flex items-center gap-2 border-b border-gray-100 pb-3 text-sm font-semibold text-gray-900">
        <input
          type="checkbox"
          className="h-4 w-4 accent-[#6B46C1]"
          checked={allChecked}
          onChange={toggleAll}
        />
        전체 동의
      </label>
      {CONSENT_ITEMS.map(item => (
        <div key={item.type}>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#6B46C1]"
              checked={value.includes(item.type)}
              onChange={() => toggle(item.type)}
            />
            <span>
              <span
                className={item.required ? 'text-[#6B46C1]' : 'text-gray-400'}
              >
                [{item.required ? '필수' : '선택'}]
              </span>{' '}
              {item.label}
            </span>
          </label>
        </div>
      ))}
    </div>
  );
};

export default ConsentChecklist;
