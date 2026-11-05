// @vitest-environment node
// app/api/cron/notifications/route.test.ts

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const mocks = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('@/app/lib/notifications/sendSummaries', () => ({
  sendDueSummaries: mocks.send,
}));

const get = (authorization?: string) =>
  GET(
    new Request('http://localhost/api/cron/notifications', {
      headers: authorization ? { authorization } : {},
    }),
  );

describe('GET /api/cron/notifications', () => {
  beforeEach(() => {
    mocks.send.mockReset();
    mocks.send.mockResolvedValue({ koreaHour: 8, delayMinutes: 3 });
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('비밀값이 맞으면 발송하고 결과를 돌려준다', async () => {
    vi.stubEnv('CRON_SECRET', 'secret');

    const res = await get('Bearer secret');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ koreaHour: 8, delayMinutes: 3 });
  });

  it.each([
    ['헤더 없음', 'secret', undefined],
    ['틀린 값', 'secret', 'Bearer wrong'],
    ['서버에 비밀값이 없음', '', 'Bearer '],
  ])('%s이면 401이고 발송하지 않는다', async (_name, secret, header) => {
    vi.stubEnv('CRON_SECRET', secret);

    const res = await get(header);

    expect(res.status).toBe(401);
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
