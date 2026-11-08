// app/lib/consent/policyNotice.ts
// 방침 변경 안내 배너에 보일 버전. 서버가 첫 HTML에 바로 그리도록 닫음 기록을 쿠키로 둔다
// (기기 저장소에 두면 화면이 뜬 뒤에야 판단할 수 있어, 배너가 늦게 끼어들며 아래 내용을 밀어낸다)

import { recentAmendment, upcomingPolicy } from '@/app/lib/consent/policies';

export const POLICY_NOTICE_COOKIE = 'greenbox_policy_notice_dismissed';
// 예전에 기기 저장소에 남긴 닫음 기록. 한 번 읽어 쿠키로 옮긴다
export const LEGACY_DISMISSED_KEY_PREFIX = 'greenbox_policy_notice_dismissed_';

export function policyNoticeVersion(
  dismissedVersion: string | undefined,
  now: number = Date.now(),
): string | null {
  const notice = upcomingPolicy(now) ?? recentAmendment(now);
  if (!notice || notice.version === dismissedVersion) return null;
  return notice.version;
}

// 닫은 버전을 기억한다. 알리는 기간(시행 전 7일, 시행 뒤 7일)보다 넉넉하게 30일
export function rememberDismissed(version: string): void {
  document.cookie = `${POLICY_NOTICE_COOKIE}=${encodeURIComponent(version)}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
}
