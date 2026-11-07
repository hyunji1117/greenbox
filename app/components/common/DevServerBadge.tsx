// app/components/common/DevServerBadge.tsx
// 로컬 개발 서버(next dev)로 열었을 때만 화면 위에 작게 표시한다
// 운영 앱과 화면이 똑같아 로컬에서 보낸 의견이 운영에 간 줄 아는 일이 있었다. 운영 빌드에서는 그리지 않는다

import React from 'react';

const DevServerBadge: React.FC = () => {
  if (process.env.NODE_ENV !== 'development') return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed top-[env(safe-area-inset-top,0px)] left-1/2 z-[70] -translate-x-1/2 rounded-b-lg bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-amber-950"
    >
      로컬 개발 서버
    </div>
  );
};

export default DevServerBadge;
