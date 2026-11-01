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
