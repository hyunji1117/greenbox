// app/lib/notifications/testPush.ts
// 운영자가 아침 시각을 기다리지 않고 지금 받을 매일 알림을 미리 받아 보는 테스트 발송
// - 문구 A와 B를 함께 보내 두 문구를 바로 비교한다
// - 실험 기록에 섞이지 않게 발송 기록을 남기지 않고, 눌러도 열기 기록이 남지 않는 주소를 쓴다

import { isDueForDaily, MAX_LEAD_DAYS } from '@/app/lib/notifications/leadTime';
import { buildSummary, VARIANTS } from '@/app/lib/notifications/copy';
import { listSummaryItems } from '@/app/lib/notifications/store';
import { deliverToUser, type DeliveryResult } from '@/app/lib/push/sendToUsers';

export type TestSource = 'due' | 'upcoming' | 'sample';

export interface TestPushResult extends DeliveryResult {
  // due: 오늘 실제로 알릴 품목 / upcoming: 일주일 안 품목 / sample: 품목이 없어 예시
  source: TestSource;
  itemCount: number;
}

export async function sendTestSummaries(
  userId: string,
  today: string,
): Promise<TestPushResult> {
  const [mine] = await listSummaryItems([userId], today, MAX_LEAD_DAYS);
  const items = mine?.items ?? [];
  const due = items.filter(isDueForDaily).map(item => item.name);
  const upcoming = items.map(item => item.name);
  const [source, names]: [TestSource, string[]] =
    due.length > 0
      ? ['due', due]
      : upcoming.length > 0
        ? ['upcoming', upcoming]
        : ['sample', ['우유', '두부']];

  const total: DeliveryResult = { sent: 0, removed: 0, failed: 0 };
  for (const variant of VARIANTS) {
    const { title, body } = buildSummary('daily', names, variant);
    const result = await deliverToUser(userId, {
      title: `[테스트 ${variant}] ${title}`,
      body,
      url: '/?tab=fridge',
    });
    total.sent += result.sent;
    total.removed += result.removed;
    total.failed += result.failed;
  }
  return { ...total, source, itemCount: names.length };
}
