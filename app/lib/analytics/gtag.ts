// app/lib/analytics/gtag.ts
// GA4로 보내는 모든 호출이 이곳을 지난다. 테스트 기기 표시도 한 곳에서 붙인다.
// 이벤트 이름은 '대상_행동' 형태로 쓰고, 값은 정해진 선택지만 보낸다(품목 이름 같은 직접 입력값은 보내지 않는다)

'use client';

import type { FinishKind } from '@/app/lib/items/useFinishWithUndo';
import type { PushStatus } from '@/app/lib/push/subscribe';

export type ItemAddSource =
  | 'fridge_quick_add'
  | 'add_form'
  | 'quick_add_items'
  | 'purchase'
  | 'photo';

type EventParams = {
  login_started: undefined;
  item_added: { source: ItemAddSource; count: number };
  item_finished: { kind: FinishKind };
  item_finish_undone: undefined;
  // 개수별 먹음 처리 (계란, 양파처럼 일부만 먹었을 때)
  item_partly_eaten: { count: number };
  comment_added: undefined;
  comment_edited: undefined;
  // 초간단 레시피. 재료 이름은 보내지 않는다
  recipe_made: undefined;
  // 레시피를 처음 쓸 때 해외 AI로 품목 이름을 보내는 데 동의
  recipe_consent_agreed: undefined;
  recipe_opened: undefined;
  recipe_step_image_opened: undefined;
  recipe_missing_added: { count: number };
  recipe_cooked: { finished: number };
  // 장보기 리스트에 담기 (찾기 결과나 사진 카드를 눌러서). 이름은 보내지 않는다
  grocery_item_added: undefined;
  // 개발 피드백 보내기. 글로 썼는지 말로 했는지만 보낸다
  feedback_sent: { input: 'text' | 'voice' };
  // 품목 카드에서 바로 고치기. 무엇을 고쳤는지만 보낸다
  item_edited: { field: 'quantity' | 'expiry' };
  item_comments_opened: undefined;
  invite_link_revoked: undefined;
  grocery_favorite_saved: { count: number };
  grocery_favorite_loaded: { count: number };
  // 동의 화면과 계정
  consent_agreed: undefined;
  consent_declined: undefined;
  logged_out: undefined;
  nickname_saved: undefined;
  // 안내 (냉장고 바꾸기 / 함께 쓰는 사람)
  guide_shown: { guide: GuideName };
  guide_action: { guide: GuideName; action: 'primary' | 'close' };
  // 앱 설치
  install_link_shared: { method: 'share' | 'copy' };
  install_prompt_result: { outcome: 'accepted' | 'dismissed' };
  policy_notice_dismissed: undefined;
  // 새 버전 반영: 앱으로 돌아올 때 자동으로, 또는 안내의 새로 고침 버튼으로
  app_updated: { how: 'auto' | 'button' };
  // 실제 사용자 기기의 성능 지표 (CLS는 1000배 한 정수)
  web_vital: {
    metric_name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
  };
  // 알림을 눌러 앱을 열었을 때. 문구 A/B 비교에 쓴다
  notification_opened: { kind: 'daily' | 'weekly'; variant: string };
  // 알림 설정. source: 처음 묻는 화면(first)인지 설정 화면(settings)인지
  notify_level_selected: {
    level: 'all' | 'watched' | 'none';
    source: 'first' | 'settings' | 'skip';
  };
  summary_time_changed: {
    kind: 'daily' | 'weekly';
    source: 'first' | 'settings';
  };
  item_watch_toggled: { watched: boolean };
  push_permission_result: { result: PushStatus | 'error' };
  // 냉장고 함께 쓰기. 냉장고 이름이나 사람 이름은 보내지 않는다
  invite_link_created: undefined;
  invite_link_shared: { method: 'share' | 'copy' };
  join_page_viewed: { state: JoinPageState };
  join_requested: { result: 'pending' | 'member' };
  join_approved: undefined;
  join_rejected: undefined;
  member_removed: undefined;
  fridge_left: undefined;
  fridge_switched: undefined;
  fridge_renamed: undefined;
  // 선반 보기 베타 (docs/decisions/0012). variant/view로 목록과 선반을 나눠 본다
  experiment_exposed: { experiment: string; variant: string };
  shelf_view_toggled: {
    view: 'list' | 'shelf';
    by: 'owner_switch';
  };
  fridge_doors_opened: undefined;
  fridge_doors_closed: undefined;
  shelf_opened: {
    category: string;
    shelf: number | 'unassigned';
    count: number;
  };
  item_shelf_set: {
    category: string;
    from: number | 'unassigned';
    to: number | 'unassigned';
  };
  shelf_count_changed: { category: string; count: number };
  // 선반 보기 아래 영역: 오늘 뭐 먹지에서 요리를 열고, 빠진 재료를 장보기에 담았는지
  // (홈의 AI 레시피 이벤트 recipe_*와 나눠 본다)
  meal_suggestion_opened: { recipe: string; rank: number; uses_soon: number };
  meal_suggestion_missing_added: { recipe: string; count: number };
  urgent_item_opened: { reason: 'expiry' | 'low_stock' };
};

export type GuideName = 'fridge_switch' | 'owner_members' | 'members_count';

export type JoinPageState =
  | 'invalid'
  | 'signed_out'
  | 'needs_consent'
  | 'member'
  | 'can_request';

export type EventName = keyof EventParams;

// 사무실 밖(모바일 데이터 등)에서 테스트하는 기기는 주소에 ?internal=on을 한 번 붙여 열면 표시가 남는다
// ?internal=off로 해제한다. 설치한 앱처럼 주소를 바꾸기 어려우면 설정 화면의 스위치로 켜고 끈다
export const INTERNAL_FLAG_KEY = 'greenbox_internal_traffic';

export interface TrafficParams {
  debug_mode?: true;
}

// 개발 환경과 표시한 기기는 개발자 트래픽(debug_mode)으로 보내 보고서에서는 빠지고 DebugView에서는 보이게 한다.
// 내부 트래픽(traffic_type=internal)은 DebugView까지 지워 이벤트 확인이 안 되므로 사무실 IP 규칙에만 맡긴다
export function resolveTrafficParams(
  search: string,
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null,
  isDev: boolean,
): TrafficParams {
  let flagged = false;
  try {
    const value = new URLSearchParams(search).get('internal');
    if (value === 'on') storage?.setItem(INTERNAL_FLAG_KEY, '1');
    if (value === 'off') storage?.removeItem(INTERNAL_FLAG_KEY);
    flagged = storage?.getItem(INTERNAL_FLAG_KEY) === '1';
  } catch {
    // 저장소를 막은 브라우저는 표시 없이 일반 트래픽으로 둔다
  }
  return isDev || flagged ? { debug_mode: true } : {};
}

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

// gtag.js가 아직 안 받아져도 호출 순서대로 쌓였다가 처리된다
// 인자는 아래 arguments로 넘기므로 이름만 둔다
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function gtag(..._args: unknown[]): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer ?? [];
  // gtag.js는 배열이 아닌 arguments 객체를 받아야 명령으로 인식한다
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

let initializedId: string | null = null;

// 설정보다 이벤트가 먼저 쌓이면 보낼 곳이 없어 버려지므로, 첫 페이지 조회 전에 한 번만 설정한다.
// 페이지 조회는 주소가 바뀔 때마다 직접 보내므로 자동 전송은 끈다
export function initAnalytics(gaId: string): void {
  if (initializedId === gaId) return;
  initializedId = gaId;
  const traffic = resolveTrafficParams(
    window.location.search,
    safeLocalStorage(),
    process.env.NODE_ENV === 'development',
  );
  gtag('js', new Date());
  // debug_mode는 설정에 넣어야 자동 수집 이벤트(스크롤 등)까지 함께 표시된다
  gtag('config', gaId, { send_page_view: false, ...traffic });
}

// 설치한 앱은 다시 열어도 페이지를 새로 불러오지 않을 수 있어, 테스트 기기 표시를 이벤트마다 다시 읽어 붙인다.
// 표시를 끈 기기는 아무것도 붙이지 않는다 (debug_mode: false도 개발자 트래픽으로 취급될 수 있음)
function liveTrafficParams(): TrafficParams {
  return process.env.NODE_ENV === 'development' || isInternalDevice()
    ? { debug_mode: true }
    : {};
}

export function trackPageView(url: string): void {
  if (!initializedId) return;
  gtag('event', 'page_view', {
    page_location: url,
    page_title: document.title,
    ...liveTrafficParams(),
  });
}

export function track<N extends EventName>(
  name: N,
  ...params: EventParams[N] extends undefined ? [] : [EventParams[N]]
): void {
  if (!initializedId) return;
  gtag('event', name, { ...(params[0] ?? {}), ...liveTrafficParams() });
}

// 설정 화면의 테스트 기기 스위치. 켜면 다음 이벤트부터 바로 개발자 트래픽으로 보낸다
export function isInternalDevice(): boolean {
  try {
    return safeLocalStorage()?.getItem(INTERNAL_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

export function setInternalDevice(on: boolean): void {
  try {
    const storage = safeLocalStorage();
    if (on) storage?.setItem(INTERNAL_FLAG_KEY, '1');
    else storage?.removeItem(INTERNAL_FLAG_KEY);
  } catch {
    // 저장소를 막은 브라우저는 표시할 수 없다
  }
}

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// 테스트에서만 사용
export function resetAnalyticsForTest(): void {
  initializedId = null;
}
