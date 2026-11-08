// app/lib/notifications/sendSummaries.ts
// 매시간 실행된다. 지금이 발송 시각인 사람에게 하루 요약과 주간 요약을 1건씩 보낸다
// 결과(대상 수, 보낸 수, 실패 수, 늦게 실행된 분)를 돌려줘 예약 실행 기록에 남긴다

import { isDueForDaily, MAX_LEAD_DAYS } from '@/app/lib/notifications/leadTime';
import {
  claimSummarySend,
  listNotificationCandidates,
  listSummaryItems,
  type NotificationCandidate,
} from '@/app/lib/notifications/store';
import {
  isDueHour,
  koreaClock,
  minutesPastHour,
  type KoreaClock,
} from '@/app/lib/notifications/schedule';
import {
  assignVariant,
  buildSummary,
  type SummaryKind,
} from '@/app/lib/notifications/copy';
import { configurePush, deliverToUser } from '@/app/lib/push/sendToUsers';

// 장보기 전 요약은 다음 장보기 전까지(일주일 안) 끝나는 품목을 모은다
export const WEEKLY_SUMMARY_DAYS = 7;

export type { SummaryKind } from '@/app/lib/notifications/copy';
export { buildSummary } from '@/app/lib/notifications/copy';

export function isDailyDue(c: NotificationCandidate, clock: KoreaClock) {
  return c.enabled && isDueHour(c.dailyHour, clock.hour);
}

export function isWeeklyDue(c: NotificationCandidate, clock: KoreaClock) {
  return (
    c.enabled &&
    c.weeklyEnabled &&
    c.weeklyDay === clock.day &&
    isDueHour(c.weeklyHour, clock.hour)
  );
}

export interface KindResult {
  // 지금이 발송 시각인 사람 수
  due: number;
  // 그중 알릴 품목이 있어 실제로 보낸 사람 수
  users: number;
  sent: number;
  removed: number;
  failed: number;
}

export interface SummaryRunResult {
  ranAt: string;
  koreaDate: string;
  koreaHour: number;
  // 정각에서 몇 분 늦게 실행됐는지
  delayMinutes: number;
  daily: KindResult;
  weekly: KindResult;
}

const emptyResult = (): KindResult => ({
  due: 0,
  users: 0,
  sent: 0,
  removed: 0,
  failed: 0,
});

export async function sendDueSummaries(
  now: Date = new Date(),
): Promise<SummaryRunResult> {
  if (!configurePush()) throw new Error('VAPID 환경변수가 없습니다');
  const clock = koreaClock(now);
  const result: SummaryRunResult = {
    ranAt: now.toISOString(),
    koreaDate: clock.date,
    koreaHour: clock.hour,
    delayMinutes: minutesPastHour(now),
    daily: emptyResult(),
    weekly: emptyResult(),
  };

  const candidates = await listNotificationCandidates();
  const weeklyIds = candidates
    .filter(c => isWeeklyDue(c, clock))
    .map(c => c.userId);
  // 같은 시각에 둘 다 해당하면 장보기 전 요약만 보낸다 (일주일 안 품목이 하루 요약 품목을 포함)
  const dailyIds = candidates
    .filter(c => isDailyDue(c, clock) && !weeklyIds.includes(c.userId))
    .map(c => c.userId);

  // 하루 요약은 가장 일찍 알리는 품목(일주일 전)까지 가져와 품목마다 알림 시작일을 따진다
  const runs: [SummaryKind, string[], number][] = [
    ['weekly', weeklyIds, WEEKLY_SUMMARY_DAYS],
    ['daily', dailyIds, MAX_LEAD_DAYS],
  ];
  for (const [kind, userIds, withinDays] of runs) {
    const tally = result[kind];
    tally.due = userIds.length;
    for (const { userId, items } of await listSummaryItems(
      userIds,
      clock.date,
      withinDays,
    )) {
      const itemNames = (
        kind === 'daily' ? items.filter(isDueForDaily) : items
      ).map(item => item.name);
      if (itemNames.length === 0) continue;
      // 알릴 품목이 없으면 기록을 남기지 않아, 그 시각 안에 품목이 생기면 다음 실행에서 받는다
      const variant = assignVariant(userId, clock.date, kind);
      if (!(await claimSummarySend(userId, kind, clock.date, variant))) {
        continue;
      }
      tally.users += 1;
      const delivered = await deliverToUser(
        userId,
        buildSummary(kind, itemNames, variant, clock.date),
      );
      tally.sent += delivered.sent;
      tally.removed += delivered.removed;
      tally.failed += delivered.failed;
    }
  }
  return result;
}
