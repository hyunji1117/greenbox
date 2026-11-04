// app/lib/push/sendToUsers.ts
// 참여 요청과 승인처럼 바로 알려야 하는 일을 해당 사용자의 기기 전체에 보낸다
// 알림이 실패해도 요청 처리는 끝난 것이므로 오류를 밖으로 던지지 않는다

import webpush from 'web-push';
import {
  deletePushSubscription,
  listPushSubscriptions,
} from '@/app/lib/push/store';

export interface PushMessage {
  title: string;
  body: string;
}

function configure(): boolean {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function sendPushToUsers(
  userIds: string[],
  message: PushMessage,
): Promise<void> {
  if (userIds.length === 0 || !configure()) return;
  const payload = JSON.stringify(message);
  await Promise.all(
    userIds.map(async userId => {
      try {
        for (const subscription of await listPushSubscriptions(userId)) {
          try {
            await webpush.sendNotification(subscription, payload);
          } catch (error) {
            const statusCode = (error as { statusCode?: number } | null)
              ?.statusCode;
            // 구독이 해제되었거나 만료된 기기
            if (statusCode === 404 || statusCode === 410) {
              await deletePushSubscription(subscription.endpoint);
            } else {
              console.error('[fridge-push] 발송 실패:', statusCode);
            }
          }
        }
      } catch (error) {
        console.error('[fridge-push] 기기 조회 실패', error);
      }
    }),
  );
}
