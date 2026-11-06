// @vitest-environment node
// app/api/feedback/route.test.ts

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { currentPolicyVersion } from '@/app/lib/consent/policies';
import { POST } from './route';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), saveFeedback: vi.fn() }));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/app/lib/feedback/store', () => ({
  saveFeedback: mocks.saveFeedback,
}));

const post = (body: unknown) =>
  POST(
    new Request('http://localhost/api/feedback', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  );
const valid = { text: ' 알림이 늦어요 ', inputMethod: 'voice', agreed: true };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({
    registered: true,
    consentVersion: currentPolicyVersion(),
    user: { id: String(Math.random()) },
  });
});

describe('POST /api/feedback', () => {
  it('로그인하지 않으면 401이고 저장하지 않는다', async () => {
    mocks.auth.mockResolvedValue(null);

    expect((await post(valid)).status).toBe(401);
    expect(mocks.saveFeedback).not.toHaveBeenCalled();
  });

  it.each([
    ['동의 없음', { ...valid, agreed: false }],
    ['빈 내용', { ...valid, text: '   ' }],
    ['너무 긴 내용', { ...valid, text: '가'.repeat(1001) }],
    ['모르는 입력 방식', { ...valid, inputMethod: 'video' }],
    ['화면 이름에 다른 값', { ...valid, page: 'a@b.com' }],
  ])('%s이면 400이고 저장하지 않는다', async (_name, body) => {
    expect((await post(body)).status).toBe(400);
    expect(mocks.saveFeedback).not.toHaveBeenCalled();
  });

  it('로그인 사용자로 다듬은 내용을 저장한다', async () => {
    mocks.auth.mockResolvedValue({
      registered: true,
      consentVersion: currentPolicyVersion(),
      user: { id: '7' },
    });

    const res = await post({ ...valid, page: 'settings', userId: '1' });

    expect(res.status).toBe(201);
    expect(mocks.saveFeedback).toHaveBeenCalledWith('7', {
      text: '알림이 늦어요',
      inputMethod: 'voice',
      page: 'settings',
      agreed: true,
    });
  });

  it('한 시간에 10건을 넘으면 429다', async () => {
    mocks.auth.mockResolvedValue({
      registered: true,
      consentVersion: currentPolicyVersion(),
      user: { id: 'burst' },
    });
    for (let i = 0; i < 10; i += 1) {
      expect((await post(valid)).status).toBe(201);
    }
    expect((await post(valid)).status).toBe(429);
  });
});
