// app/lib/telemetry/client.ts
// 브라우저에서 성능 지표와 화면 오류를 모았다가, 화면을 떠나거나 숨길 때 한 번에 보낸다
// - 주소의 검색어, 초대 코드, 품목 이름 같은 값은 보내지 않는다. 화면 이름(탭)과 코드 위치만 보낸다
// - 로컬 개발 서버는 보내지 않는다. 테스트 기기로 표시한 기기는 성능 지표를 보내지 않는다 (오류는 보낸다)

'use client';

import { isInternalDevice } from '@/app/lib/analytics/gtag';
import { APP_VERSION } from '@/app/lib/app/version';
import type { ClientError, Vital } from '@/app/lib/schemas/telemetry';
import { VITAL_METRICS } from '@/app/lib/schemas/telemetry';

const ENDPOINT = '/api/telemetry';
// 화면 하나에서 같은 오류가 반복돼도 이만큼만 보낸다
const MAX_ERRORS_PER_LOAD = 5;
const FLUSH_SIZE = 10;

const vitals: Vital[] = [];
const errors: ClientError[] = [];
const seenErrors = new Set<string>();
let errorCount = 0;

const isDev = () => process.env.NODE_ENV === 'development';

// "/" 는 탭 이름(home, fridge…), 나머지는 첫 경로만 (/join/코드 → join, /privacy/버전 → privacy)
export function pageName(pathname: string, search: string): string {
  if (pathname === '/') {
    const tab = new URLSearchParams(search).get('tab');
    return tab && /^[a-z]{1,20}$/i.test(tab) ? tab : 'home';
  }
  const first = pathname.split('/').filter(Boolean)[0] ?? 'home';
  return /^[a-z0-9_-]{1,40}$/i.test(first) ? first : 'other';
}

const currentPage = () =>
  pageName(window.location.pathname, window.location.search);

// 오류 메시지와 코드 위치에 섞인 주소의 검색어(?code= 등)를 지운다
export function scrub(text: string, max: number): string {
  return text.replace(/\?[^\s)'"]*/g, '').slice(0, max);
}

export function flushTelemetry(): void {
  if (vitals.length === 0 && errors.length === 0) return;
  const body = JSON.stringify({
    appVersion: APP_VERSION,
    vitals: vitals.splice(0, 20),
    errors: errors.splice(0, 10),
  });
  try {
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon?.(ENDPOINT, blob)) return;
  } catch {
    // sendBeacon을 막은 브라우저는 아래로
  }
  void fetch(ENDPOINT, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
  }).catch(() => {});
}

export interface ReportedMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType?: string;
}

export function reportVital(metric: ReportedMetric): void {
  if (isDev() || isInternalDevice()) return;
  if (!(VITAL_METRICS as readonly string[]).includes(metric.name)) return;
  vitals.push({
    metric: metric.name as Vital['metric'],
    // CLS는 점수라 소수점을 남기고, 나머지는 밀리초로 반올림
    value:
      metric.name === 'CLS'
        ? Math.round(metric.value * 1000) / 1000
        : Math.round(metric.value),
    rating: metric.rating,
    page: currentPage(),
    navigationType: metric.navigationType?.slice(0, 20),
  });
  if (vitals.length >= FLUSH_SIZE) flushTelemetry();
}

export function reportError(kind: ClientError['kind'], error: unknown): void {
  if (isDev() || errorCount >= MAX_ERRORS_PER_LOAD) return;
  const raw =
    error instanceof Error
      ? error
      : new Error(typeof error === 'string' ? error : String(error));
  const message = scrub(raw.message || raw.name || 'unknown', 300);
  if (seenErrors.has(message)) return;
  seenErrors.add(message);
  errorCount += 1;
  errors.push({
    kind,
    message,
    stack: raw.stack ? scrub(raw.stack, 2000) : undefined,
    page: currentPage(),
  });
  // 오류는 화면이 멈춰 떠나지 못할 수 있어 바로 보낸다
  flushTelemetry();
}

let installed = false;

// 한 번만 건다. 화면을 숨기거나 떠날 때 모아 둔 지표를 보낸다
export function installTelemetry(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', event =>
    reportError('error', event.error ?? event.message),
  );
  window.addEventListener('unhandledrejection', event =>
    reportError('rejection', event.reason),
  );
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushTelemetry();
  });
  window.addEventListener('pagehide', flushTelemetry);
}

// 테스트에서만 사용
export function resetTelemetryForTest(): void {
  vitals.length = 0;
  errors.length = 0;
  seenErrors.clear();
  errorCount = 0;
}
