// app/lib/analytics/gtag.ts
// GA4로 보내는 모든 호출이 이곳을 지난다. 테스트 트래픽 표시도 한 곳에서 붙인다.
// 이벤트 이름은 '대상_행동' 형태로 쓰고, 값은 정해진 선택지만 보낸다(품목 이름 같은 직접 입력값은 보내지 않는다)

'use client';

import type { FinishKind } from '@/app/lib/items/useFinishWithUndo';
import type { PushStatus } from '@/app/lib/push/subscribe';

export type ItemAddSource =
  | 'fridge_quick_add'
  | 'add_form'
  | 'quick_add_items'
  | 'purchase';

type EventParams = {
  login_started: undefined;
  item_added: { source: ItemAddSource; count: number };
  item_finished: { kind: FinishKind };
  item_finish_undone: undefined;
  comment_added: undefined;
  push_permission_result: { result: PushStatus | 'error' };
};

export type EventName = keyof EventParams;

// 사무실 밖(모바일 데이터 등)에서 테스트하는 기기는 주소에 ?internal=on을 한 번 붙여 열면 표시가 남는다
// ?internal=off로 해제한다
export const INTERNAL_FLAG_KEY = 'greenbox_internal_traffic';

export interface TrafficParams {
  traffic_type?: 'internal';
  debug_mode?: true;
}

// 개발 환경과 표시한 기기는 내부 트래픽으로 보내 보고서에서 걸러지게 하고, DebugView에서는 바로 보이게 한다
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
  return isDev || flagged ? { traffic_type: 'internal', debug_mode: true } : {};
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
  // set은 자동 수집 이벤트(스크롤 등)까지 표시를 붙이고, debug_mode는 설정에 있어야 DebugView에 잡힌다
  if (traffic.traffic_type) gtag('set', traffic);
  gtag('config', gaId, { send_page_view: false, ...traffic });
}

export function trackPageView(url: string): void {
  if (!initializedId) return;
  gtag('event', 'page_view', {
    page_location: url,
    page_title: document.title,
  });
}

export function track<N extends EventName>(
  name: N,
  ...params: EventParams[N] extends undefined ? [] : [EventParams[N]]
): void {
  if (!initializedId) return;
  gtag('event', name, params[0] ?? {});
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
