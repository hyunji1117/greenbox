// @vitest-environment node
// app/api/notifications/test/route.test.ts

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getMyProfile: vi.fn(),
  configurePush: vi.fn(),
  sendTestSummaries: vi.fn(),
}));
vi.mock('@/app/api/items/guard', () => ({ requireUser: mocks.requireUser }));
vi.mock('@/app/lib/user/profile', () => ({ getMyProfile: mocks.getMyProfile }));
vi.mock('@/app/lib/push/sendToUsers', () => ({
  configurePush: mocks.configurePush,
}));
vi.mock('@/app/lib/notifications/testPush', () => ({
  sendTestSummaries: mocks.sendTestSummaries,
}));

import { OPERATOR } from '@/app/lib/consent/operator';
import { POST } from './route';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireUser.mockResolvedValue({ userId: '1' });
  mocks.configurePush.mockReturnValue(true);
  mocks.sendTestSummaries.mockResolvedValue({
    sent: 2,
    removed: 0,
    failed: 0,
    source: 'due',
    itemCount: 1,
  });
});

describe('POST /api/notifications/test', () => {
  it('운영자 계정만 자기 기기로 보낼 수 있다', async () => {
    mocks.getMyProfile.mockResolvedValue({ email: 'someone@example.com' });
    expect((await POST()).status).toBe(403);
    expect(mocks.sendTestSummaries).not.toHaveBeenCalled();

    mocks.getMyProfile.mockResolvedValue({ email: OPERATOR.email });
    const res = await POST();
    expect(res.status).toBe(200);
    expect(mocks.sendTestSummaries).toHaveBeenCalledWith(
      '1',
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );
  });

  it('로그인하지 않으면 그대로 거절한다', async () => {
    mocks.requireUser.mockResolvedValue({
      response: NextResponse.json({}, { status: 401 }),
    });
    expect((await POST()).status).toBe(401);
  });
});
