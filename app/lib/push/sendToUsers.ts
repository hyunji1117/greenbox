// app/lib/push/sendToUsers.ts
// 사용자의 기기 전체에 푸시를 보낸다
// 참여 요청과 승인처럼 바로 알려야 하는 일은 sendPushToUsers, 매시간 요약 알림은 deliverToUser를 쓴다

import webpush from 'web-push';
import {
  deletePushSubscription,
  listPushSubscriptions,
} from '@/app/lib/push/store';

export interface PushMessage {
  title: string;
  body: string;
}

export interface DeliveryResult {
  sent: number;
  // 구독이 해제되었거나 만료되어 지운 기기
  removed: number;
  failed: number;
}

// VAPID 키가 없으면 false (보낼 수 없음)
export function configurePush(): boolean {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

// configurePush가 먼저 성공해야 한다
export async function deliverToUser(
  userId: string,
  message: PushMessage,
): Promise<DeliveryResult> {
  const result: DeliveryResult = { sent: 0, removed: 0, failed: 0 };
  const payload = JSON.stringify(message);
  for (const subscription of await listPushSubscriptions(userId)) {
    try {
      await webpush.sendNotification(subscription, payload);
      result.sent += 1;
    } catch (error) {
      const statusCode = (error as { statusCode?: number } | null)?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await deletePushSubscription(subscription.endpoint);
        result.removed += 1;
      } else {
        // 푸시 주소에 기기 식별 값이 있어 오류 상태만 남긴다
        console.error('[push] 발송 실패:', statusCode);
        result.failed += 1;
      }
    }
  }
  return result;
}

// 알림이 실패해도 요청 처리는 끝난 것이므로 오류를 밖으로 던지지 않는다
export async function sendPushToUsers(
  userIds: string[],
  message: PushMessage,
): Promise<void> {
  if (userIds.length === 0 || !configurePush()) return;
  await Promise.all(
    userIds.map(userId =>
      deliverToUser(userId, message).catch(error =>
        console.error('[push] 기기 조회 실패', error),
      ),
    ),
  );
}
