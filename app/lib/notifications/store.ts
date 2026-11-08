// app/lib/notifications/store.ts
// 알림 설정, 냉장고별 알림 수준, 관심 품목, 요약 알림 대상 조회 (서버 전용)

import { getPool } from '@/app/lib/db';
import {
  DEFAULT_NOTIFICATION_SETTINGS as D,
  type NotificationSettings,
  type NotificationSettingsResponse,
  type NotifyLevel,
  type UpdateNotificationSettings,
} from '@/app/lib/schemas/notifications';

interface SettingsRow {
  enabled: boolean;
  daily_hour: number;
  weekly_enabled: boolean;
  weekly_day: number;
  weekly_hour: number;
}

function toSettings(row: SettingsRow): NotificationSettings {
  return {
    enabled: row.enabled,
    dailyHour: row.daily_hour,
    weeklyEnabled: row.weekly_enabled,
    weeklyDay: row.weekly_day,
    weeklyHour: row.weekly_hour,
  };
}

// 저장한 적이 없으면 기본값을 돌려준다
export async function getNotificationSettings(
  userId: string,
): Promise<NotificationSettingsResponse> {
  const { rows } = await getPool().query<SettingsRow>(
    `SELECT enabled, daily_hour, weekly_enabled, weekly_day, weekly_hour
     FROM notification_settings WHERE user_id = $1`,
    [Number(userId)],
  );
  return rows[0]
    ? { settings: toSettings(rows[0]), saved: true }
    : { settings: D, saved: false };
}

// 보낸 항목만 바꾼다. 처음 저장하면 나머지는 기본값으로 채운다
export async function saveNotificationSettings(
  userId: string,
  input: UpdateNotificationSettings,
): Promise<NotificationSettings> {
  const { rows } = await getPool().query<SettingsRow>(
    `INSERT INTO notification_settings
       (user_id, enabled, daily_hour, weekly_enabled, weekly_day, weekly_hour)
     VALUES ($1, COALESCE($2::boolean, $7::boolean),
             COALESCE($3::smallint, $8::smallint),
             COALESCE($4::boolean, $9::boolean),
             COALESCE($5::smallint, $10::smallint),
             COALESCE($6::smallint, $11::smallint))
     ON CONFLICT (user_id) DO UPDATE SET
       enabled = COALESCE($2::boolean, notification_settings.enabled),
       daily_hour = COALESCE($3::smallint, notification_settings.daily_hour),
       weekly_enabled = COALESCE($4::boolean, notification_settings.weekly_enabled),
       weekly_day = COALESCE($5::smallint, notification_settings.weekly_day),
       weekly_hour = COALESCE($6::smallint, notification_settings.weekly_hour),
       updated_at = now()
     RETURNING enabled, daily_hour, weekly_enabled, weekly_day, weekly_hour`,
    [
      Number(userId),
      input.enabled ?? null,
      input.dailyHour ?? null,
      input.weeklyEnabled ?? null,
      input.weeklyDay ?? null,
      input.weeklyHour ?? null,
      D.enabled,
      D.dailyHour,
      D.weeklyEnabled,
      D.weeklyDay,
      D.weeklyHour,
    ],
  );
  return toSettings(rows[0]);
}

// 내가 구성원인 냉장고에서만 바뀐다. 구성원이 아니면 false
export async function setNotifyLevel(
  userId: string,
  fridgeId: string,
  level: NotifyLevel,
): Promise<boolean> {
  const { rowCount } = await getPool().query(
    `UPDATE fridge_members SET notify_level = $3
     WHERE fridge_id = $1 AND user_id = $2`,
    [fridgeId, Number(userId), level],
  );
  return rowCount === 1;
}

// 종 버튼. 내가 구성원인 냉장고의 품목이 아니면 false
export async function setItemWatched(
  userId: string,
  itemId: string,
  watched: boolean,
): Promise<boolean> {
  const pool = getPool();
  const { rowCount } = await pool.query(
    `SELECT 1 FROM items i
     JOIN fridge_members m ON m.fridge_id = i.fridge_id AND m.user_id = $1
     WHERE i.id = $2`,
    [Number(userId), itemId],
  );
  if (!rowCount) return false;
  await pool.query(
    watched
      ? `INSERT INTO item_watchers (item_id, user_id) VALUES ($2, $1) ON CONFLICT DO NOTHING`
      : `DELETE FROM item_watchers WHERE item_id = $2 AND user_id = $1`,
    [Number(userId), itemId],
  );
  return true;
}

export interface NotificationCandidate extends NotificationSettings {
  userId: string;
}

// 알림을 받을 기기가 있는 사람과 그 사람의 설정 (저장한 적이 없으면 기본값)
export async function listNotificationCandidates(): Promise<
  NotificationCandidate[]
> {
  const { rows } = await getPool().query<SettingsRow & { user_id: number }>(
    `SELECT u.id AS user_id,
       COALESCE(s.enabled, $1) AS enabled,
       COALESCE(s.daily_hour, $2) AS daily_hour,
       COALESCE(s.weekly_enabled, $3) AS weekly_enabled,
       COALESCE(s.weekly_day, $4) AS weekly_day,
       COALESCE(s.weekly_hour, $5) AS weekly_hour
     FROM users u
     LEFT JOIN notification_settings s ON s.user_id = u.id
     WHERE EXISTS (SELECT 1 FROM push_subscriptions p WHERE p.user_id = u.id)`,
    [D.enabled, D.dailyHour, D.weeklyEnabled, D.weeklyDay, D.weeklyHour],
  );
  return rows.map(row => ({
    userId: String(row.user_id),
    ...toSettings(row),
  }));
}

export interface SummaryItem {
  name: string;
  // 오늘부터 유통기한까지 남은 날 (오늘이 마지막 날이면 0)
  daysLeft: number;
  // 등록한 날부터 유통기한까지 (알림 시작일을 정하는 보관 기간)
  periodDays: number;
}

export interface SummaryItems {
  userId: string;
  items: SummaryItem[];
}

// 한국 날짜 today부터 withinDays일 안에 끝나는 품목을 사람마다 묶는다 (유통기한이 가까운 순)
// 냉장고별 알림 수준을 따른다: 전체 품목 / 관심 품목만(고르지 않았으면 이것) / 받지 않음
// 지난 품목은 매일 다시 알리지 않는다
export async function listSummaryItems(
  userIds: string[],
  today: string,
  withinDays: number,
): Promise<SummaryItems[]> {
  if (userIds.length === 0) return [];
  const { rows } = await getPool().query<{
    user_id: number;
    items: SummaryItem[];
  }>(
    `SELECT m.user_id, json_agg(json_build_object(
         'name', i.name,
         'daysLeft', i.expiry_date - $2::date,
         'periodDays', i.expiry_date - (i.created_at AT TIME ZONE 'Asia/Seoul')::date
       ) ORDER BY i.expiry_date, i.id) AS items
     FROM fridge_members m
     JOIN items i ON i.fridge_id = m.fridge_id
     WHERE m.user_id = ANY($1::int[])
       AND NOT i.finished
       AND i.expiry_date BETWEEN $2::date AND $2::date + $3::integer
       AND (
         m.notify_level = 'all'
         OR (COALESCE(m.notify_level, 'watched') = 'watched' AND EXISTS (
           SELECT 1 FROM item_watchers w WHERE w.item_id = i.id AND w.user_id = m.user_id
         ))
       )
     GROUP BY m.user_id`,
    [userIds.map(Number), today, withinDays],
  );
  return rows.map(row => ({
    userId: String(row.user_id),
    items: row.items,
  }));
}

// 그 기간에 처음이면 true. 매시간 실행이 겹치거나 늦어도 하루 1번, 주 1번만 통과한다
export async function claimSummarySend(
  userId: string,
  kind: 'daily' | 'weekly',
  period: string,
  // 알림 문구 A/B에서 이 사람이 받은 문구
  variant?: string,
): Promise<boolean> {
  const { rowCount } = await getPool().query(
    `INSERT INTO notification_sends (user_id, kind, period, variant)
     VALUES ($1, $2, $3::date, $4) ON CONFLICT DO NOTHING`,
    [Number(userId), kind, period, variant ?? null],
  );
  return rowCount === 1;
}

export interface VariantSummary {
  kind: 'daily' | 'weekly';
  variant: string;
  sent: number;
  opened: number;
}

// 알림 문구별 보낸 수와 눌러서 연 수 (문구를 기록하기 시작한 뒤의 발송만)
export async function summarizePushVariants(
  sinceDays: number,
): Promise<VariantSummary[]> {
  const { rows } = await getPool().query<{
    kind: 'daily' | 'weekly';
    variant: string;
    sent: number;
    opened: number;
  }>(
    `SELECT kind, variant, count(*)::int AS sent, count(opened_at)::int AS opened
     FROM notification_sends
     WHERE variant IS NOT NULL AND period > current_date - $1::integer
     GROUP BY kind, variant
     ORDER BY kind, variant`,
    [sinceDays],
  );
  return rows;
}

// 알림을 눌러 앱을 열었을 때. 본인이 받은 그 알림에만, 처음 연 시각만 남긴다
export async function markSummaryOpened(
  userId: string,
  kind: 'daily' | 'weekly',
  period: string,
): Promise<boolean> {
  const { rowCount } = await getPool().query(
    `UPDATE notification_sends SET opened_at = now()
     WHERE user_id = $1 AND kind = $2 AND period = $3::date AND opened_at IS NULL`,
    [Number(userId), kind, period],
  );
  return rowCount === 1;
}
