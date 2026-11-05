// app/lib/consent/policies.test.ts

import { describe, expect, it } from 'vitest';
import { POLICY_BODIES } from '@/app/privacy/versions';
import {
  POLICY_RELEASES,
  currentPolicyVersion,
  policyDateLabel,
  upcomingPolicy,
} from './policies';

const at = (iso: string) => new Date(iso).getTime();

describe('개인정보처리방침 버전', () => {
  it('시행 시각 전에는 지금 방침을 쓰고 새 방침은 시행 예정으로 알린다', () => {
    const before = at('2026-11-11T23:59:59+09:00');
    expect(currentPolicyVersion(before)).toBe('2026-10-02');
    expect(upcomingPolicy(before)?.version).toBe('2026-11-12');
  });

  it('한국 시간 자정이 되면 새 방침으로 바뀌고 예정 방침은 없어진다', () => {
    const after = at('2026-11-12T00:00:00+09:00');
    expect(currentPolicyVersion(after)).toBe('2026-11-12');
    expect(upcomingPolicy(after)).toBeNull();
  });

  it('모든 버전에 본문이 있고, 바뀐 점은 3줄 이내다', () => {
    for (const release of POLICY_RELEASES) {
      expect(POLICY_BODIES[release.version]).toBeTypeOf('function');
      expect(release.changes.length).toBeLessThanOrEqual(3);
    }
    expect(Object.keys(POLICY_BODIES)).toHaveLength(POLICY_RELEASES.length);
  });

  it('버전이 시행일 순서이고 시행 시각의 날짜와 같다', () => {
    const versions = POLICY_RELEASES.map(r => r.version);
    expect([...versions].sort()).toEqual(versions);
    for (const release of POLICY_RELEASES) {
      expect(release.effectiveAt.slice(0, 10)).toBe(release.version);
    }
  });

  it('시행일을 읽기 쉽게 표시한다', () => {
    expect(policyDateLabel('2026-11-12')).toBe('2026년 11월 12일');
    expect(policyDateLabel('2026-11-03', false)).toBe('11월 3일');
  });
});
