'use client';
// app/components/auth/ConsentChecklist.tsx
// 개인정보 동의 체크리스트 (로그인 화면, 동의 화면에서 같이 쓴다)

import React from 'react';
import Link from 'next/link';
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
        <div key={item.type} className="flex items-center justify-between">
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
          {item.href && (
            <Link
              href={item.href}
              target="_blank"
              className="text-xs text-gray-500 underline"
            >
              보기
            </Link>
          )}
        </div>
      ))}
    </div>
  );
};

export default ConsentChecklist;
