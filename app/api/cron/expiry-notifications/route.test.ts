// @vitest-environment node
// app/api/cron/expiry-notifications/route.test.ts

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const mocks = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('@/app/lib/push/sendExpiryNotifications', () => ({
  sendExpiryNotifications: mocks.send,
}));

const get = (authorization?: string) =>
  GET(
    new Request('http://localhost/api/cron/expiry-notifications', {
      headers: authorization ? { authorization } : {},
    }),
  );

describe('GET /api/cron/expiry-notifications', () => {
  beforeEach(() => {
    mocks.send.mockReset();
    mocks.send.mockResolvedValue({ users: 1, sent: 1, removed: 0, failed: 0 });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('비밀값이 맞으면 발송하고 결과를 돌려준다', async () => {
    vi.stubEnv('CRON_SECRET', 'secret');

    const res = await get('Bearer secret');

    expect(res.status).toBe(200);
    expect(mocks.send).toHaveBeenCalledOnce();
  });

  it.each([
    ['헤더 없음', 'secret', undefined],
    ['틀린 값', 'secret', 'Bearer wrong'],
    ['서버 비밀값 미설정', '', 'Bearer '],
  ])('%s이면 401이고 발송하지 않는다', async (_, secret, header) => {
    vi.stubEnv('CRON_SECRET', secret);

    expect((await get(header)).status).toBe(401);
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
