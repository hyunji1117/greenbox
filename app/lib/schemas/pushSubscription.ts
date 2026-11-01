// app/lib/schemas/pushSubscription.ts
// 브라우저 PushSubscription.toJSON() 요청 계약.
// 서버가 이 주소로 요청을 보내므로 주요 브라우저의 푸시 서비스 주소만 받는다.

import { z } from 'zod';

const ENDPOINT_MAX = 2048;
const KEY_MAX = 256;

const PUSH_SERVICE_HOSTS =
  /^(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|([a-z0-9-]+\.)*push\.apple\.com|([a-z0-9-]+\.)*notify\.windows\.com)$/;

const keySchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]+={0,2}$/)
  .max(KEY_MAX);

export const PushSubscriptionSchema = z.object({
  endpoint: z
    .url({ protocol: /^https$/, hostname: PUSH_SERVICE_HOSTS })
    .max(ENDPOINT_MAX),
  keys: z.object({ p256dh: keySchema, auth: keySchema }),
});

export type PushSubscriptionInput = z.infer<typeof PushSubscriptionSchema>;
