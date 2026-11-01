// @vitest-environment node
// app/lib/push/sendExpiryNotifications.test.ts

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildExpiryNotification,
  sendExpiryNotifications,
} from './sendExpiryNotifications';

const mocks = vi.hoisted(() => ({
  sendNotification: vi.fn(),
  setVapidDetails: vi.fn(),
  listExpiringUsers: vi.fn(),
  listPushSubscriptions: vi.fn(),
  claimTodaysSend: vi.fn(),
  deletePushSubscription: vi.fn(),
}));

vi.mock('web-push', () => ({
  default: {
    sendNotification: mocks.sendNotification,
    setVapidDetails: mocks.setVapidDetails,
  },
}));
vi.mock('@/app/lib/push/store', () => ({
  listExpiringUsers: mocks.listExpiringUsers,
  listPushSubscriptions: mocks.listPushSubscriptions,
  claimTodaysSend: mocks.claimTodaysSend,
  deletePushSubscription: mocks.deletePushSubscription,
}));

const device = (id: string) => ({
  endpoint: `https://fcm.googleapis.com/fcm/send/${id}`,
  keys: { p256dh: 'p', auth: 'a' },
});

describe('buildExpiryNotification', () => {
  it('품목 수에 따라 문구를 만든다', () => {
    expect(buildExpiryNotification(['우유']).body).toContain('우유의');
    expect(buildExpiryNotification(['우유', '두부', '달걀']).body).toContain(
      '우유 외 2개',
    );
  });
});

describe('sendExpiryNotifications', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('VAPID_SUBJECT', 'mailto:a@example.com');
    vi.stubEnv('VAPID_PUBLIC_KEY', 'public');
    vi.stubEnv('VAPID_PRIVATE_KEY', 'private');
    mocks.listExpiringUsers.mockResolvedValue([
      { userId: '1', itemNames: ['우유'] },
    ]);
    mocks.claimTodaysSend.mockResolvedValue(true);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('모든 기기에 보내고 만료된 기기는 지우며 다른 실패는 지우지 않는다', async () => {
    mocks.listPushSubscriptions.mockResolvedValue([
      device('ok'),
      device('gone'),
      device('error'),
    ]);
    mocks.sendNotification
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce({ statusCode: 410 })
      .mockRejectedValueOnce({ statusCode: 500 });

    await expect(sendExpiryNotifications()).resolves.toEqual({
      users: 1,
      sent: 1,
      removed: 1,
      failed: 1,
    });
    expect(mocks.deletePushSubscription).toHaveBeenCalledOnce();
    expect(mocks.deletePushSubscription).toHaveBeenCalledWith(
      device('gone').endpoint,
    );
  });

  it('오늘 이미 보냈으면 다시 보내지 않는다', async () => {
    mocks.listPushSubscriptions.mockResolvedValue([device('ok')]);
    mocks.claimTodaysSend.mockResolvedValue(false);

    await sendExpiryNotifications();

    expect(mocks.sendNotification).not.toHaveBeenCalled();
  });

  it('기기가 없으면 발송 기록을 남기지 않는다', async () => {
    mocks.listPushSubscriptions.mockResolvedValue([]);

    await sendExpiryNotifications();

    expect(mocks.claimTodaysSend).not.toHaveBeenCalled();
  });

  it('VAPID 키가 없으면 실패한다', async () => {
    vi.stubEnv('VAPID_PRIVATE_KEY', '');

    await expect(sendExpiryNotifications()).rejects.toThrow('VAPID');
  });
});
