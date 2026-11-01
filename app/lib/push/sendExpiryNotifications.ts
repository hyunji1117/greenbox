// app/lib/push/sendExpiryNotifications.ts
// 유통기한이 가까운 품목을 사용자별로 묶어 하루 한 번 서버 푸시로 알린다

import webpush from 'web-push';
import { EXPIRY_SOON_DAYS } from '@/app/lib/items/expiry';
import {
  claimTodaysSend,
  deletePushSubscription,
  listExpiringUsers,
  listPushSubscriptions,
} from '@/app/lib/push/store';

export function buildExpiryNotification(itemNames: string[]) {
  const [first, ...rest] = itemNames;
  return {
    title: '곧 먹어야 할 식재료가 있어요',
    body:
      rest.length > 0
        ? `${first} 외 ${rest.length}개의 유통기한이 ${EXPIRY_SOON_DAYS}일 안에 끝나요`
        : `${first}의 유통기한이 ${EXPIRY_SOON_DAYS}일 안에 끝나요`,
  };
}

// 구독이 해제되었거나 만료된 기기라는 푸시 서비스의 응답
function isGoneSubscription(error: unknown): boolean {
  const statusCode = (error as { statusCode?: number } | null)?.statusCode;
  return statusCode === 404 || statusCode === 410;
}

export interface SendResult {
  users: number;
  sent: number;
  removed: number;
  failed: number;
}

export async function sendExpiryNotifications(): Promise<SendResult> {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) {
    throw new Error('VAPID 환경변수가 없습니다');
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const result: SendResult = { users: 0, sent: 0, removed: 0, failed: 0 };
  for (const { userId, itemNames } of await listExpiringUsers(
    EXPIRY_SOON_DAYS,
  )) {
    const subscriptions = await listPushSubscriptions(userId);
    // 기기가 없으면 기록을 남기지 않아, 같은 날 기기를 등록해도 다음 실행에서 받을 수 있다
    if (subscriptions.length === 0 || !(await claimTodaysSend(userId))) {
      continue;
    }
    result.users += 1;
    const payload = JSON.stringify(buildExpiryNotification(itemNames));
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(subscription, payload);
        result.sent += 1;
      } catch (error) {
        if (isGoneSubscription(error)) {
          await deletePushSubscription(subscription.endpoint);
          result.removed += 1;
        } else {
          // 푸시 주소에 기기 식별 값이 있어 오류 상태만 남긴다
          console.error(
            '[expiry-notifications] 발송 실패:',
            (error as { statusCode?: number } | null)?.statusCode,
          );
          result.failed += 1;
        }
      }
    }
  }
  return result;
}
