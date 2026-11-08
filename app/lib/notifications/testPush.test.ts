// @vitest-environment node
// app/lib/notifications/testPush.test.ts

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listSummaryItems: vi.fn(),
  deliverToUser: vi.fn(),
}));
vi.mock('@/app/lib/notifications/store', () => ({
  listSummaryItems: mocks.listSummaryItems,
}));
vi.mock('@/app/lib/push/sendToUsers', () => ({
  deliverToUser: mocks.deliverToUser,
}));

import { sendTestSummaries } from './testPush';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.deliverToUser.mockResolvedValue({ sent: 1, removed: 0, failed: 0 });
});

describe('sendTestSummaries', () => {
  it('오늘 알릴 품목으로 A와 B 문구를 한 번씩 보내고, 열기 기록이 남지 않는 주소를 쓴다', async () => {
    mocks.listSummaryItems.mockResolvedValue([
      {
        userId: '1',
        items: [
          { name: '우유', daysLeft: 1, periodDays: 10 },
          { name: '냉동 만두', daysLeft: 20, periodDays: 90 },
        ],
      },
    ]);

    const result = await sendTestSummaries('1', '2026-11-09');

    expect(result).toEqual({
      sent: 2,
      removed: 0,
      failed: 0,
      source: 'due',
      itemCount: 1,
    });
    expect(mocks.deliverToUser.mock.calls.map(c => c[1].title)).toEqual([
      '[테스트 A] 곧 먹어야 할 식재료가 있어요',
      '[테스트 B] 오늘은 우유 먼저 먹어 볼까요?',
    ]);
    expect(mocks.deliverToUser.mock.calls[0][1].url).toBe('/?tab=fridge');
  });

  it('알릴 품목이 없으면 일주일 안 품목, 그것도 없으면 예시로 보낸다', async () => {
    mocks.listSummaryItems.mockResolvedValue([
      { userId: '1', items: [{ name: '사과', daysLeft: 5, periodDays: 60 }] },
    ]);
    expect((await sendTestSummaries('1', '2026-11-09')).source).toBe(
      'upcoming',
    );

    mocks.listSummaryItems.mockResolvedValue([]);
    expect((await sendTestSummaries('1', '2026-11-09')).source).toBe('sample');
  });
});
