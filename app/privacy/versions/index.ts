// app/privacy/versions/index.ts
// 방침 버전과 본문 연결. 새 버전을 추가하면 policies.ts의 POLICY_RELEASES에도 넣는다

import type { ComponentType } from 'react';
import Policy20261002 from './Policy20261002';
import Policy20261112 from './Policy20261112';

export const POLICY_BODIES: Record<string, ComponentType> = {
  '2026-10-02': Policy20261002,
  '2026-11-12': Policy20261112,
};
