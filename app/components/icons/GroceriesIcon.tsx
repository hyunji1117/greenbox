// app/components/icons/GroceriesIcon.tsx
// lucide의 groceries 아이콘 (lucide-react 1.70.0, ISC 라이선스, Lucide Icons and Contributors)
// 앱이 쓰는 lucide-react 0.544.0에는 아직 없어, 메이저 버전을 올리지 않고 이 아이콘 하나만 같은 방식으로 만든다
// lucide-react를 1.x로 올리면 이 파일을 지우고 lucide-react의 Groceries를 쓴다

import { createLucideIcon } from 'lucide-react';

const GroceriesIcon = createLucideIcon('groceries', [
  ['path', { d: 'M10 15h4', key: '192ueg' }],
  [
    'path',
    {
      d: 'M19.424 11.095a2.5 2.5 0 00.471-2.309 2 2 0 00.424-3.286 2 2 0 00-2.143-3.322 2 2 0 00-.676.502 2 2 0 00-3.287.424 2.5 2.5 0 00-3.189 2.06A3 3 0 0012 11l4-4',
      key: 'ioa4ee',
    },
  ],
  [
    'path',
    {
      d: 'M4 12.006A1 1 0 014.994 11H19a1 1 0 011 1v7a2 2 0 01-2 2H6a2 2 0 01-2-2z',
      key: '1y761e',
    },
  ],
  [
    'path',
    {
      d: 'M7 11a4 4 0 01-4-4V5a1 1 0 011-1h2a4 4 0 013.584 2.222',
      key: 'g173vy',
    },
  ],
]);

export default GroceriesIcon;
