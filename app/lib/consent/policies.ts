// app/lib/consent/policies.ts
// 동의 항목과 개인정보처리방침 버전 정의.
// 방침을 바꿀 때는 POLICY_RELEASES에 새 버전과 시행 시각을 추가한다 (시행 7일 전에는 배포해 둔다)
// 시행 전에는 앱 안 배너로 미리 알리고, 시행 시각이 지나면 다음 요청부터 바로 동의 화면으로 보낸다

export interface PolicyRelease {
  // 시행일을 버전 이름으로 쓴다 (동의 기록의 policy_version에 저장)
  version: string;
  // 시행 시각 (한국 시간 자정)
  effectiveAt: string;
  // 다시 동의하는 사람에게 보여 줄 바뀐 점 (3줄 이내)
  changes: readonly string[];
}

// 오래된 버전부터 적는다
export const POLICY_RELEASES: readonly PolicyRelease[] = [
  {
    version: '2026-10-02',
    effectiveAt: '2026-10-02T00:00:00+09:00',
    changes: [],
  },
  {
    version: '2026-11-12',
    effectiveAt: '2026-11-12T00:00:00+09:00',
    changes: [
      '냉장고 품목과 댓글을 기기가 아닌 서버에 저장해요',
      '가족과 냉장고를 함께 쓰면 구성원끼리 이름, 사진, 품목과 댓글이 보여요',
      '사진으로 등록하면 식재료를 찾기 위해 사진을 Anthropic(미국)에 보내요',
    ],
  },
];

const effectiveTime = (release: PolicyRelease) =>
  new Date(release.effectiveAt).getTime();

// 지금 적용 중인 방침
export function currentPolicy(now: number = Date.now()): PolicyRelease {
  const applied = POLICY_RELEASES.filter(r => effectiveTime(r) <= now);
  return applied[applied.length - 1] ?? POLICY_RELEASES[0];
}

export function currentPolicyVersion(now: number = Date.now()): string {
  return currentPolicy(now).version;
}

// 시행을 앞둔 방침. 없으면 null
export function upcomingPolicy(now: number = Date.now()): PolicyRelease | null {
  return POLICY_RELEASES.find(r => effectiveTime(r) > now) ?? null;
}

export function findPolicy(version: string): PolicyRelease | null {
  return POLICY_RELEASES.find(r => r.version === version) ?? null;
}

// 시행일 표시: '2026-11-12' → '2026년 11월 12일' (withYear가 false면 '11월 12일')
export function policyDateLabel(version: string, withYear = true): string {
  const [y, m, d] = version.split('-').map(Number);
  return withYear ? `${y}년 ${m}월 ${d}일` : `${m}월 ${d}일`;
}

export type ConsentType = 'privacy_collection' | 'age_over_14';

export const CONSENT_ITEMS: {
  type: ConsentType;
  label: string;
  required: boolean;
  href?: string;
}[] = [
  {
    type: 'privacy_collection',
    label: '개인정보 수집·이용 동의',
    required: true,
    href: '/privacy',
  },
  {
    type: 'age_over_14',
    label: '만 14세 이상입니다',
    required: true,
  },
];

export const REQUIRED_CONSENTS = CONSENT_ITEMS.filter(i => i.required).map(
  i => i.type,
);

export function isConsentType(v: unknown): v is ConsentType {
  return CONSENT_ITEMS.some(i => i.type === v);
}

// 필수 항목에 모두 동의했는지
export function hasAllRequired(types: ConsentType[]): boolean {
  return REQUIRED_CONSENTS.every(t => types.includes(t));
}
