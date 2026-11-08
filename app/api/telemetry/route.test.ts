// @vitest-environment node
// app/api/telemetry/route.test.ts

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  saveVitals: vi.fn(),
  saveErrors: vi.fn(),
}));
vi.mock('@/app/lib/telemetry/store', () => mocks);

import { POST } from './route';

const post = (body: unknown, origin = 'https://greenbox.test') =>
  POST(
    new Request('https://greenbox.test/api/telemetry', {
      method: 'POST',
      headers: {
        origin,
        'user-agent': 'Mozilla/5.0 (iPhone) Safari/604.1',
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );

const batch = {
  appVersion: '1.6.0',
  vitals: [{ metric: 'LCP', value: 2294, rating: 'good', page: 'fridge' }],
  errors: [{ kind: 'error', message: 'boom', page: 'fridge' }],
};

beforeEach(() => vi.clearAllMocks());

describe('POST /api/telemetry', () => {
  it('같은 사이트에서 보낸 기록을 기기 종류와 함께 저장한다 (브라우저 문자열은 저장하지 않음)', async () => {
    const res = await post(batch);
    expect(res.status).toBe(204);
    expect(mocks.saveVitals).toHaveBeenCalledWith(batch.vitals, {
      device: 'mobile',
      appVersion: '1.6.0',
    });
    expect(mocks.saveErrors).toHaveBeenCalledWith(batch.errors, {
      device: 'mobile',
      appVersion: '1.6.0',
      browser: 'safari',
    });
  });

  it('다른 사이트에서 보낸 요청은 받지 않는다', async () => {
    expect((await post(batch, 'https://evil.test')).status).toBe(403);
    expect(mocks.saveVitals).not.toHaveBeenCalled();
  });

  it('형식이 틀리거나 화면 이름에 다른 값이 섞이면 받지 않는다', async () => {
    expect((await post('not json')).status).toBe(400);
    expect(
      (
        await post({
          ...batch,
          vitals: [{ ...batch.vitals[0], page: 'join?code=abc' }],
        })
      ).status,
    ).toBe(400);
  });
});
