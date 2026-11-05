// app/privacy/PolicyParts.tsx
// 개인정보처리방침 버전별 본문이 함께 쓰는 조각

import React from 'react';

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-gray-700">
        {children}
      </div>
    </section>
  );
}

export const cell = 'border border-gray-200 px-2 py-1.5 align-top';
