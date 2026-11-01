// app/lib/push/store.ts
// 서버 푸시를 보낼 기기 정보 저장소

import { getPool } from '@/app/lib/db';
import type { PushSubscriptionInput } from '@/app/lib/schemas/pushSubscription';

// 같은 기기가 다시 저장되면 행을 늘리지 않고 갱신한다. 기기를 함께 쓰다 계정이 바뀌면 새 사용자로 옮긴다
export async function savePushSubscription(
  userId: string,
  input: PushSubscriptionInput,
): Promise<void> {
  await getPool().query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE
     SET user_id = EXCLUDED.user_id,
         p256dh = EXCLUDED.p256dh,
         auth = EXCLUDED.auth,
         updated_at = now()`,
    [Number(userId), input.endpoint, input.keys.p256dh, input.keys.auth],
  );
}

export interface StoredPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function listPushSubscriptions(
  userId: string,
): Promise<StoredPushSubscription[]> {
  const { rows } = await getPool().query<{
    endpoint: string;
    p256dh: string;
    auth: string;
  }>(
    `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`,
    [Number(userId)],
  );
  return rows.map(({ endpoint, p256dh, auth }) => ({
    endpoint,
    keys: { p256dh, auth },
  }));
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  await getPool().query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [
    endpoint,
  ]);
}

export interface ExpiringUser {
  userId: string;
  itemNames: string[];
}

// 한국 날짜 기준으로 오늘부터 며칠 안에 끝나는 품목. 지난 품목은 매일 다시 알리지 않는다
export async function listExpiringUsers(
  withinDays: number,
): Promise<ExpiringUser[]> {
  const { rows } = await getPool().query<{
    user_id: number;
    item_names: string[];
  }>(
    `SELECT user_id, array_agg(name ORDER BY expiry_date, id) AS item_names
     FROM items
     WHERE NOT finished
       AND expiry_date BETWEEN (now() AT TIME ZONE 'Asia/Seoul')::date
         AND (now() AT TIME ZONE 'Asia/Seoul')::date + $1::integer
     GROUP BY user_id`,
    [withinDays],
  );
  return rows.map(row => ({
    userId: String(row.user_id),
    itemNames: row.item_names,
  }));
}

// 오늘 처음이면 true. 예약 실행이 중복되어도 사용자당 하루 한 번만 통과한다
export async function claimTodaysSend(userId: string): Promise<boolean> {
  const { rowCount } = await getPool().query(
    `INSERT INTO expiry_notification_sends (user_id, sent_on)
     VALUES ($1, (now() AT TIME ZONE 'Asia/Seoul')::date)
     ON CONFLICT DO NOTHING`,
    [Number(userId)],
  );
  return rowCount === 1;
}
