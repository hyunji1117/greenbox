// app/lib/consent/policies.ts
// 동의 항목과 개인정보처리방침 버전 정의.
// 방침을 바꿀 때는 POLICY_RELEASES에 새 버전과 시행 시각을 추가한다 (시행 7일 전에는 배포해 둔다)
// 시행 전에는 앱 안 배너로 미리 알리고, 시행 시각이 지나면 다음 요청부터 바로 동의 화면으로 보낸다
// 원하는 사람만 쓰는 기능을 더하는 것처럼 다시 동의받을 필요가 없는 변경은 requiresConsent: false로 두고,
// 그 기능을 쓸 때 따로 동의를 받는다. 이때는 시행 뒤 7일 동안 앱 안 배너로 알린다

export interface PolicyRelease {
  // 시행일을 버전 이름으로 쓴다 (동의 기록의 policy_version에 저장)
  version: string;
  // 시행 시각 (한국 시간 자정)
  effectiveAt: string;
  // 다시 동의하는 사람에게 보여 줄 바뀐 점 (3줄 이내)
  changes: readonly string[];
  // false면 시행돼도 다시 동의를 받지 않는다 (없으면 true)
  requiresConsent?: boolean;
}

// 오래된 버전부터 적는다
export const POLICY_RELEASES: readonly PolicyRelease[] = [
  {
    version: '2026-10-02',
    effectiveAt: '2026-10-02T00:00:00+09:00',
    changes: [],
  },
  {
    version: '2026-11-05',
    effectiveAt: '2026-11-05T00:00:00+09:00',
    changes: [
      '냉장고 품목과 댓글을 기기가 아닌 서버에 저장해요',
      '가족과 냉장고를 함께 쓰면 구성원끼리 이름, 사진, 품목과 댓글이 보여요',
      '사진으로 등록하면 식재료를 찾기 위해 사진을 Anthropic(미국)에 보내요',
    ],
  },
  {
    version: '2026-11-06',
    effectiveAt: '2026-11-06T00:00:00+09:00',
    changes: [
      '의견 보내기로 보낸 내용을 서비스 개선에 쓰고 1년 뒤 지워요',
      '의견을 운영자 메일로 모아 보내기 위해 Resend(미국)를 써요',
    ],
    // 의견 보내기는 원하는 사람만 쓰고, 보낼 때 따로 동의를 받는다
    requiresConsent: false,
  },
];

const effectiveTime = (release: PolicyRelease) =>
  new Date(release.effectiveAt).getTime();

const requiresConsent = (release: PolicyRelease) =>
  release.requiresConsent !== false;

// 동의를 받아야 하는 방침 중 지금 적용 중인 것. 로그인과 API는 이 버전에 동의했는지 확인한다
export function currentPolicy(now: number = Date.now()): PolicyRelease {
  const applied = POLICY_RELEASES.filter(
    r => effectiveTime(r) <= now && requiresConsent(r),
  );
  return applied[applied.length - 1] ?? POLICY_RELEASES[0];
}

export function currentPolicyVersion(now: number = Date.now()): string {
  return currentPolicy(now).version;
}

// 지금 적용 중인 방침 본문 (다시 동의받지 않는 변경까지 포함). /privacy에 보여 준다
export function latestPolicyVersion(now: number = Date.now()): string {
  const applied = POLICY_RELEASES.filter(r => effectiveTime(r) <= now);
  return (applied[applied.length - 1] ?? POLICY_RELEASES[0]).version;
}

// 다시 동의받지 않고 시행된 변경을 알리는 기간
export const AMENDMENT_NOTICE_DAYS = 7;

// 최근 7일 안에 다시 동의 없이 시행된 방침. 없으면 null
export function recentAmendment(
  now: number = Date.now(),
): PolicyRelease | null {
  const latest = findPolicy(latestPolicyVersion(now));
  if (!latest || requiresConsent(latest)) return null;
  const elapsed = now - effectiveTime(latest);
  return elapsed < AMENDMENT_NOTICE_DAYS * 24 * 60 * 60 * 1000 ? latest : null;
}

// 시행을 앞둔 방침. 없으면 null
export function upcomingPolicy(now: number = Date.now()): PolicyRelease | null {
  return POLICY_RELEASES.find(r => effectiveTime(r) > now) ?? null;
}

// 바로 이전 방침 버전. 첫 방침이면 null
export function previousPolicyVersion(version: string): string | null {
  const index = POLICY_RELEASES.findIndex(r => r.version === version);
  return index > 0 ? POLICY_RELEASES[index - 1].version : null;
}

export function findPolicy(version: string): PolicyRelease | null {
  return POLICY_RELEASES.find(r => r.version === version) ?? null;
}

// 시행일 표시: '2026-11-05' → '2026년 11월 5일' (withYear가 false면 '11월 5일')
export function policyDateLabel(version: string, withYear = true): string {
  const [y, m, d] = version.split('-').map(Number);
  return withYear ? `${y}년 ${m}월 ${d}일` : `${m}월 ${d}일`;
}

export type ConsentType = 'privacy_collection' | 'age_over_14';

export const CONSENT_ITEMS: {
  type: ConsentType;
  label: string;
  required: boolean;
}[] = [
  {
    type: 'privacy_collection',
    label: '개인정보 수집·이용 동의',
    required: true,
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
