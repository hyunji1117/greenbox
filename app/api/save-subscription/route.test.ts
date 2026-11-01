// @vitest-environment node
// app/api/save-subscription/route.test.ts

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POLICY_VERSION } from '@/app/lib/consent/policies';
import { POST } from './route';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  savePushSubscription: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/app/lib/push/store', () => ({
  savePushSubscription: mocks.savePushSubscription,
}));

const subscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc',
  expirationTime: null,
  keys: { p256dh: 'BPublic_key-1', auth: 'auth_key-1' },
};

const post = (body: unknown) =>
  POST(
    new Request('http://localhost/api/save-subscription', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );

describe('POST /api/save-subscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({
      registered: true,
      consentVersion: POLICY_VERSION,
      user: { id: '7' },
    });
  });

  it('로그인 사용자의 기기 정보를 필요한 필드만 저장한다', async () => {
    const res = await post(subscription);

    expect(res.status).toBe(204);
    expect(mocks.savePushSubscription).toHaveBeenCalledWith('7', {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    });
  });

  it('로그인하지 않으면 401이고 저장하지 않는다', async () => {
    mocks.auth.mockResolvedValue(null);

    expect((await post(subscription)).status).toBe(401);
    expect(mocks.savePushSubscription).not.toHaveBeenCalled();
  });

  it.each([
    ['https가 아닌 주소', { ...subscription, endpoint: 'http://localhost/x' }],
    ['키 누락', { endpoint: subscription.endpoint }],
    ['JSON이 아닌 본문', 'not-json'],
  ])('%s는 400이고 저장하지 않는다', async (_, body) => {
    expect((await post(body)).status).toBe(400);
    expect(mocks.savePushSubscription).not.toHaveBeenCalled();
  });
});
