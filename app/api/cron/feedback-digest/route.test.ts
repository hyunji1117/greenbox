// @vitest-environment node
// app/api/cron/feedback-digest/route.test.ts

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const mocks = vi.hoisted(() => ({ run: vi.fn() }));
vi.mock('@/app/lib/feedback/digest', () => ({ runFeedbackDigest: mocks.run }));

const get = (query = '', authorization = 'Bearer secret') =>
  GET(
    new Request(`http://localhost/api/cron/feedback-digest${query}`, {
      headers: { authorization },
    }),
  );

describe('GET /api/cron/feedback-digest', () => {
  beforeEach(() => {
    mocks.run.mockReset();
    mocks.run.mockResolvedValue({ status: 'not_due', koreaHour: 15 });
    vi.stubEnv('CRON_SECRET', 'secret');
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });
  afterEach(() => vi.unstubAllEnvs());

  it('비밀값이 틀리면 401이고 실행하지 않는다', async () => {
    expect((await get('?now=1', 'Bearer wrong')).status).toBe(401);
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it('평소에는 시각을 따르고, now=1이면 지금 보내기로 실행한다', async () => {
    await get();
    await get('?now=1');
    expect(mocks.run.mock.calls.map(call => call[2])).toEqual([
      { sendNow: false },
      { sendNow: true },
    ]);
  });
});
