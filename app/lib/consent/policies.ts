// app/lib/consent/policies.ts
// 동의 항목과 현재 방침 버전 정의.
// 개인정보처리방침 내용을 바꾸면 POLICY_VERSION을 올린다 → 기존 사용자는 다음 로그인 때 다시 동의한다.

export const POLICY_VERSION = '2026-09-27';

// 로그인 전 동의 내용을 OAuth 왕복 동안 들고 있는 쿠키
export const PENDING_CONSENT_COOKIE = 'gb_pending_consent';

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
