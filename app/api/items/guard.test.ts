// @vitest-environment node
// app/api/items/guard.test.ts

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  auth: vi.fn(),
}));
vi.mock('next/headers', () => ({ headers: mocks.headers }));
vi.mock('@/auth', () => ({ auth: mocks.auth }));

import { APP_VERSION } from '@/app/lib/app/version';
import { currentPolicyVersion } from '@/app/lib/consent/policies';
import { requireUser } from './guard';

const withVersion = (version: string | null) =>
  mocks.headers.mockResolvedValue(
    new Headers(version ? { 'x-app-version': version } : {}),
  );

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({
    registered: true,
    consentVersion: currentPolicyVersion(),
    user: { id: '7' },
  });
});

describe('requireUser 버전 확인', () => {
  it('지금 배포된 버전의 앱만 통과시킨다', async () => {
    withVersion(APP_VERSION);
    expect(await requireUser()).toEqual({ userId: '7' });
  });

  it('버전을 붙이지 않은 예전 앱은 동의 화면 주소로 옮기게 해 앱을 다시 열라는 안내를 보게 한다', async () => {
    withVersion(null);
    const old = await requireUser();
    expect(old.response?.status).toBe(403);
    expect(await old.response?.json()).toEqual({
      error: 'consent_required',
      reason: 'app_restart_required',
    });
  });

  it('다른 버전 앱은 업데이트가 필요하다고 거절한다', async () => {
    withVersion('0.0.1');
    expect((await requireUser()).response?.status).toBe(426);
    expect(mocks.auth).not.toHaveBeenCalled();
  });

  it('브라우저가 직접 불러오는 이미지처럼 버전을 붙일 수 없는 요청은 통과시킨다', async () => {
    withVersion(null);
    expect(await requireUser({ allowAnyVersion: true })).toEqual({
      userId: '7',
    });
  });
});
