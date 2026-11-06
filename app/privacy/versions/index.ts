// app/privacy/versions/index.ts
// 방침 버전과 본문 연결. 새 버전을 추가하면 policies.ts의 POLICY_RELEASES에도 넣는다

import type { ComponentType } from 'react';
import Policy20261002 from './Policy20261002';
import Policy20261105 from './Policy20261105';
import Policy20261106 from './Policy20261106';

export const POLICY_BODIES: Record<string, ComponentType> = {
  '2026-10-02': Policy20261002,
  '2026-11-05': Policy20261105,
  '2026-11-06': Policy20261106,
};
