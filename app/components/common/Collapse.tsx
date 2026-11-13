// app/components/common/Collapse.tsx
// 내용을 부드럽게 접고 펼친다. 접힌 동안은 키보드와 화면 읽기 프로그램도 건너뛴다(inert)
// 높이를 재지 않고 grid 행 높이(0fr ↔ 1fr)를 바꿔, 내용 길이와 상관없이 자연스럽게 움직인다

import React from 'react';

interface CollapseProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}

const Collapse: React.FC<CollapseProps> = ({
  isOpen,
  children,
  className = '',
}) => (
  <div
    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
    } ${className}`}
  >
    <div className="min-h-0 overflow-hidden" inert={!isOpen}>
      {children}
    </div>
  </div>
);

export default Collapse;
