// @vitest-environment node
// app/lib/notifications/sendSummaries.test.ts

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/app/lib/schemas/notifications';
import { buildSummary, sendDueSummaries } from './sendSummaries';

const mocks = vi.hoisted(() => ({
  configurePush: vi.fn(),
  deliverToUser: vi.fn(),
  listNotificationCandidates: vi.fn(),
  listSummaryItems: vi.fn(),
  claimSummarySend: vi.fn(),
}));

vi.mock('@/app/lib/push/sendToUsers', () => ({
  configurePush: mocks.configurePush,
  deliverToUser: mocks.deliverToUser,
}));
vi.mock('@/app/lib/notifications/store', () => ({
  listNotificationCandidates: mocks.listNotificationCandidates,
  listSummaryItems: mocks.listSummaryItems,
  claimSummarySend: mocks.claimSummarySend,
}));

const person = (userId: string, overrides = {}) => ({
  userId,
  ...DEFAULT_NOTIFICATION_SETTINGS,
  ...overrides,
});

// 2026-11-06(금) 08:05 KST
const FRIDAY_8AM = new Date('2026-11-05T23:05:00Z');
// 2026-11-07(토) 12:20 KST
const SATURDAY_NOON = new Date('2026-11-07T03:20:00Z');

beforeEach(() => {
  vi.resetAllMocks();
  mocks.configurePush.mockReturnValue(true);
  mocks.claimSummarySend.mockResolvedValue(true);
  mocks.deliverToUser.mockResolvedValue({ sent: 1, removed: 0, failed: 0 });
  mocks.listSummaryItems.mockImplementation(async (userIds: string[]) =>
    userIds.map(userId => ({ userId, itemNames: ['우유', '두부'] })),
  );
});

describe('buildSummary', () => {
  it('하루 요약과 주간 요약 문구를 품목 수에 맞게 만든다', () => {
    expect(buildSummary('daily', ['우유']).body).toBe(
      '우유의 유통기한이 3일 안에 끝나요',
    );
    expect(buildSummary('weekly', ['우유', '두부', '달걀']).body).toContain(
      '우유 외 2개',
    );
  });
});

describe('sendDueSummaries', () => {
  it('하루 요약 시각이 지금인 사람에게만 3일 안 품목을 보낸다', async () => {
    mocks.listNotificationCandidates.mockResolvedValue([
      person('1'),
      person('2', { dailyHour: 17 }),
      person('3', { enabled: false }),
    ]);

    const result = await sendDueSummaries(FRIDAY_8AM);

    expect(mocks.listSummaryItems).toHaveBeenCalledWith(['1'], '2026-11-06', 3);
    expect(mocks.claimSummarySend).toHaveBeenCalledWith(
      '1',
      'daily',
      '2026-11-06',
    );
    expect(mocks.deliverToUser).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      koreaDate: '2026-11-06',
      koreaHour: 8,
      delayMinutes: 5,
      daily: { due: 1, users: 1, sent: 1 },
      weekly: { due: 0, users: 0 },
    });
  });

  it('이미 보낸 사람은 다시 보내지 않는다', async () => {
    mocks.listNotificationCandidates.mockResolvedValue([person('1')]);
    mocks.claimSummarySend.mockResolvedValue(false);

    const result = await sendDueSummaries(FRIDAY_8AM);

    expect(mocks.deliverToUser).not.toHaveBeenCalled();
    expect(result.daily).toMatchObject({ due: 1, users: 0 });
  });

  it('주간 요약 요일과 시각에는 일주일 안 품목을 보낸다', async () => {
    mocks.listNotificationCandidates.mockResolvedValue([
      person('1'),
      person('2', { weeklyEnabled: false }),
    ]);

    const result = await sendDueSummaries(SATURDAY_NOON);

    expect(mocks.listSummaryItems).toHaveBeenCalledWith(['1'], '2026-11-07', 7);
    expect(mocks.deliverToUser).toHaveBeenCalledWith('1', {
      title: '이번 주에 먹어야 할 식재료',
      body: expect.stringContaining('우유 외 1개'),
    });
    expect(result.weekly).toMatchObject({ due: 1, users: 1 });
  });

  it('하루 요약과 주간 요약이 같은 시각이면 주간 요약만 보낸다', async () => {
    mocks.listNotificationCandidates.mockResolvedValue([
      person('1', { dailyHour: 12 }),
    ]);

    const result = await sendDueSummaries(SATURDAY_NOON);

    expect(mocks.deliverToUser).toHaveBeenCalledTimes(1);
    expect(result.daily.due).toBe(0);
    expect(result.weekly.users).toBe(1);
  });

  it('VAPID 키가 없으면 실패로 알린다 (예약 실행이 실패로 기록되게)', async () => {
    mocks.configurePush.mockReturnValue(false);

    await expect(sendDueSummaries(FRIDAY_8AM)).rejects.toThrow(/VAPID/);
  });
});
