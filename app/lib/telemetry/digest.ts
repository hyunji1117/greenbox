// app/lib/telemetry/digest.ts
// 매일 아침 한 번 운영 지표를 메일로 보낸다
// - 실제 사용자 기기의 성능 지표 p75 (최근 24시간), 많이 난 화면 오류 (최근 24시간)
// - 알림 문구별 보낸 수와 눌러서 연 수 (최근 7일, 전체)
// 90일이 지난 성능, 오류 기록은 이때 지운다

import { APP_NAME } from '@/app/lib/brand';
import { sendDigestEmail, type DigestEmail } from '@/app/lib/feedback/digest';
import {
  summarizePushVariants,
  type VariantSummary,
} from '@/app/lib/notifications/store';
import { isDueHour, koreaClock } from '@/app/lib/notifications/schedule';
import {
  deleteExpiredTelemetry,
  hasOpsDigestSent,
  recordOpsDigestSent,
  summarizeErrors,
  summarizeVitals,
  type ErrorSummary,
  type VitalSummary,
} from '@/app/lib/telemetry/store';

// 의견 모음 메일(9시)과 겹치지 않게 오전 9시대에 함께 보낸다
export const OPS_DIGEST_HOUR = 9;

// web.dev 기준 "좋음" 경계 (CLS는 점수, 나머지는 밀리초)
export const GOOD_THRESHOLD: Record<string, number> = {
  LCP: 2500,
  INP: 200,
  CLS: 0.1,
  FCP: 1800,
  TTFB: 800,
};

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const formatValue = (metric: string, value: number) =>
  metric === 'CLS'
    ? value.toFixed(3)
    : `${Math.round(value).toLocaleString('en-US')}ms`;

const cell =
  'style="padding:4px 10px;border-bottom:1px solid #eee;text-align:left"';

function vitalsTable(rows: VitalSummary[]): string {
  if (rows.length === 0)
    return '<p>최근 24시간 동안 모인 성능 지표가 없어요.</p>';
  const body = rows
    .map(r => {
      const good = r.p75 <= (GOOD_THRESHOLD[r.metric] ?? Infinity);
      return `<tr><td ${cell}>${r.metric}</td><td ${cell}>${r.device === 'mobile' ? '모바일' : 'PC'}</td><td ${cell}><b style="color:${good ? '#2E7D5B' : '#B4442E'}">${formatValue(r.metric, r.p75)}</b></td><td ${cell}>${r.count}</td><td ${cell}>${Math.round(r.poorShare * 100)}%</td></tr>`;
    })
    .join('');
  return `<table style="border-collapse:collapse"><tr><th ${cell}>지표</th><th ${cell}>기기</th><th ${cell}>p75</th><th ${cell}>건수</th><th ${cell}>나쁨 비율</th></tr>${body}</table>
<p style="color:#666;font-size:12px">p75: 사용자 75%가 이보다 빨랐다는 뜻. 초록은 web.dev "좋음" 기준 안 (LCP 2.5초, INP 200ms, CLS 0.1)</p>`;
}

function errorsList(rows: ErrorSummary[]): string {
  if (rows.length === 0) return '<p>최근 24시간 동안 화면 오류가 없어요.</p>';
  return `<ol>${rows
    .map(
      r =>
        `<li style="margin-bottom:10px"><b>${r.count}회</b> / ${r.kind} / ${escapeHtml(r.page)} / v${escapeHtml(r.appVersion)}<br>${escapeHtml(r.message)}${
          r.lastStack
            ? `<pre style="font-size:11px;color:#666;white-space:pre-wrap">${escapeHtml(r.lastStack.split('\n').slice(0, 4).join('\n'))}</pre>`
            : ''
        }</li>`,
    )
    .join('')}</ol>`;
}

function variantTable(title: string, rows: VariantSummary[]): string {
  if (rows.length === 0)
    return `<p>${title}: 아직 문구를 기록한 알림이 없어요.</p>`;
  const kindLabel = { daily: '매일 알림', weekly: '장보기 전 알림' } as const;
  return `<p><b>${title}</b></p><table style="border-collapse:collapse"><tr><th ${cell}>알림</th><th ${cell}>문구</th><th ${cell}>보냄</th><th ${cell}>열어 봄</th><th ${cell}>열기 비율</th></tr>${rows
    .map(
      r =>
        `<tr><td ${cell}>${kindLabel[r.kind]}</td><td ${cell}>${escapeHtml(r.variant)}</td><td ${cell}>${r.sent}</td><td ${cell}>${r.opened}</td><td ${cell}>${r.sent ? Math.round((r.opened / r.sent) * 100) : 0}%</td></tr>`,
    )
    .join('')}</table>`;
}

export interface OpsSnapshot {
  vitals: VitalSummary[];
  errors: ErrorSummary[];
  variantsWeek: VariantSummary[];
  variantsAll: VariantSummary[];
}

export function buildOpsDigestHtml(s: OpsSnapshot): string {
  return `<h3>실제 사용자 성능 (최근 24시간)</h3>${vitalsTable(s.vitals)}
<h3>화면 오류 (최근 24시간, 많은 순)</h3>${errorsList(s.errors)}
<h3>알림 문구 A/B</h3>${variantTable('최근 7일', s.variantsWeek)}${variantTable('실험 시작부터', s.variantsAll)}
<p style="color:#666;font-size:12px">사용자가 적어 비율 차이는 참고용입니다. 판단 기준은 실험 계획 문서를 따릅니다. 성능과 오류 기록에는 누구의 기록인지 남기지 않으며 90일 뒤 지웁니다.</p>`;
}

export type OpsDigestResult =
  | { status: 'not_due' | 'already_sent'; koreaHour: number }
  | { status: 'no_data'; deleted: number }
  | { status: 'sent'; vitals: number; errors: number; deleted: number };

export async function runOpsDigest(
  now: Date = new Date(),
  send: (email: DigestEmail) => Promise<void> = sendDigestEmail,
  { sendNow = false }: { sendNow?: boolean } = {},
): Promise<OpsDigestResult> {
  const clock = koreaClock(now);
  if (!sendNow && !isDueHour(OPS_DIGEST_HOUR, clock.hour)) {
    return { status: 'not_due', koreaHour: clock.hour };
  }
  if (await hasOpsDigestSent(clock.date)) {
    return { status: 'already_sent', koreaHour: clock.hour };
  }

  const deleted = await deleteExpiredTelemetry();
  const snapshot: OpsSnapshot = {
    vitals: await summarizeVitals(24),
    errors: await summarizeErrors(24),
    variantsWeek: await summarizePushVariants(7),
    variantsAll: await summarizePushVariants(3650),
  };
  const vitalCount = snapshot.vitals.reduce((n, r) => n + r.count, 0);
  const errorCount = snapshot.errors.reduce((n, r) => n + r.count, 0);
  if (
    vitalCount === 0 &&
    errorCount === 0 &&
    snapshot.variantsAll.length === 0
  ) {
    return { status: 'no_data', deleted };
  }

  // 같은 날 두 번 보내지 않도록 먼저 기록한다 (매시간 실행이 겹쳐도 한 번)
  if (!(await recordOpsDigestSent(clock.date))) {
    return { status: 'already_sent', koreaHour: clock.hour };
  }
  await send({
    subject: `[${APP_NAME}] 운영 지표 (${clock.date}) 오류 ${errorCount}건`,
    html: buildOpsDigestHtml(snapshot),
  });
  return { status: 'sent', vitals: vitalCount, errors: errorCount, deleted };
}
