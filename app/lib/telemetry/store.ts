// app/lib/telemetry/store.ts
// 성능 지표와 화면 오류 저장, 운영 지표 메일용 집계 (서버 전용)
// 회원 번호 없이 저장한다. 90일이 지난 기록은 운영 지표 메일을 만들 때 지운다

import { getPool } from '@/app/lib/db';
import type { ClientError, Vital } from '@/app/lib/schemas/telemetry';
import type { Device } from '@/app/lib/telemetry/userAgent';

export const RETENTION_DAYS = 90;

interface Context {
  device: Device;
  appVersion: string;
}

export async function saveVitals(vitals: Vital[], ctx: Context): Promise<void> {
  if (vitals.length === 0) return;
  await getPool().query(
    `INSERT INTO web_vitals (metric, value, rating, page, device, navigation_type, app_version)
     SELECT v.metric, v.value, v.rating, v.page, $2, v.navigation_type, $3
     FROM jsonb_to_recordset($1::jsonb)
       AS v(metric text, value real, rating text, page text, navigation_type text)`,
    [
      JSON.stringify(
        vitals.map(v => ({
          metric: v.metric,
          value: v.value,
          rating: v.rating,
          page: v.page,
          navigation_type: v.navigationType ?? null,
        })),
      ),
      ctx.device,
      ctx.appVersion,
    ],
  );
}

export async function saveErrors(
  errors: ClientError[],
  ctx: Context & { browser: string },
): Promise<void> {
  if (errors.length === 0) return;
  await getPool().query(
    `INSERT INTO client_errors (kind, message, stack, page, device, browser, app_version)
     SELECT e.kind, e.message, e.stack, e.page, $2, $3, $4
     FROM jsonb_to_recordset($1::jsonb)
       AS e(kind text, message text, stack text, page text)`,
    [
      JSON.stringify(
        errors.map(e => ({
          kind: e.kind,
          message: e.message,
          stack: e.stack ?? null,
          page: e.page,
        })),
      ),
      ctx.device,
      ctx.browser,
      ctx.appVersion,
    ],
  );
}

export async function deleteExpiredTelemetry(): Promise<number> {
  const pool = getPool();
  const vitals = await pool.query(
    `DELETE FROM web_vitals WHERE created_at < now() - make_interval(days => $1)`,
    [RETENTION_DAYS],
  );
  const errors = await pool.query(
    `DELETE FROM client_errors WHERE created_at < now() - make_interval(days => $1)`,
    [RETENTION_DAYS],
  );
  return (vitals.rowCount ?? 0) + (errors.rowCount ?? 0);
}

export interface VitalSummary {
  metric: string;
  device: Device;
  count: number;
  p75: number;
  poorShare: number;
}

// 최근 hours시간의 지표별, 기기 종류별 p75 (사용자 75%가 이보다 빠름)
export async function summarizeVitals(hours: number): Promise<VitalSummary[]> {
  const { rows } = await getPool().query<{
    metric: string;
    device: Device;
    count: number;
    p75: number;
    poor_share: number;
  }>(
    `SELECT metric, device, count(*)::int AS count,
            percentile_cont(0.75) WITHIN GROUP (ORDER BY value)::float AS p75,
            avg((rating = 'poor')::int)::float AS poor_share
     FROM web_vitals
     WHERE created_at > now() - make_interval(hours => $1)
     GROUP BY metric, device
     ORDER BY metric, device`,
    [hours],
  );
  return rows.map(r => ({
    metric: r.metric,
    device: r.device,
    count: r.count,
    p75: r.p75,
    poorShare: r.poor_share,
  }));
}

export interface ErrorSummary {
  kind: string;
  message: string;
  page: string;
  count: number;
  appVersion: string;
  lastStack: string | null;
}

// 최근 hours시간의 오류를 같은 메시지끼리 묶어 많은 순으로
export async function summarizeErrors(
  hours: number,
  limit = 10,
): Promise<ErrorSummary[]> {
  const { rows } = await getPool().query<{
    kind: string;
    message: string;
    page: string;
    count: number;
    app_version: string;
    last_stack: string | null;
  }>(
    `SELECT kind, message, min(page) AS page, count(*)::int AS count,
            max(app_version) AS app_version,
            (array_agg(stack ORDER BY created_at DESC))[1] AS last_stack
     FROM client_errors
     WHERE created_at > now() - make_interval(hours => $1)
     GROUP BY kind, message
     ORDER BY count DESC, message
     LIMIT $2`,
    [hours, limit],
  );
  return rows.map(r => ({
    kind: r.kind,
    message: r.message,
    page: r.page,
    count: r.count,
    appVersion: r.app_version,
    lastStack: r.last_stack,
  }));
}

export async function hasOpsDigestSent(date: string): Promise<boolean> {
  const { rowCount } = await getPool().query(
    `SELECT 1 FROM ops_digest_sends WHERE sent_on = $1::date`,
    [date],
  );
  return (rowCount ?? 0) > 0;
}

export async function recordOpsDigestSent(date: string): Promise<boolean> {
  const { rowCount } = await getPool().query(
    `INSERT INTO ops_digest_sends (sent_on) VALUES ($1::date) ON CONFLICT DO NOTHING`,
    [date],
  );
  return rowCount === 1;
}
