// @vitest-environment node
// app/api/me/notifications/route.test.ts
// 알림 설정, 냉장고별 알림 수준, 관심 품목 API

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { currentPolicyVersion } from '@/app/lib/consent/policies';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/app/lib/schemas/notifications';
import { PUT as PUT_LEVEL } from '@/app/api/fridges/[id]/notify-level/route';
import {
  DELETE as UNWATCH,
  PUT as WATCH,
} from '@/app/api/items/[id]/watch/route';
import { GET, PATCH } from './route';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getNotificationSettings: vi.fn(),
  saveNotificationSettings: vi.fn(),
  setNotifyLevel: vi.fn(),
  setItemWatched: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/app/lib/notifications/store', () => ({
  getNotificationSettings: mocks.getNotificationSettings,
  saveNotificationSettings: mocks.saveNotificationSettings,
  setNotifyLevel: mocks.setNotifyLevel,
  setItemWatched: mocks.setItemWatched,
}));

const json = (method: string, body: unknown) =>
  new Request('http://localhost/api', {
    method,
    body: JSON.stringify(body),
  });
const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({
    registered: true,
    consentVersion: currentPolicyVersion(),
    user: { id: '7' },
  });
});

describe('/api/me/notifications', () => {
  it('로그인하지 않으면 401이다', async () => {
    mocks.auth.mockResolvedValue(null);

    expect((await GET()).status).toBe(401);
    expect(mocks.getNotificationSettings).not.toHaveBeenCalled();
  });

  it('내 설정을 돌려준다', async () => {
    mocks.getNotificationSettings.mockResolvedValue({
      settings: DEFAULT_NOTIFICATION_SETTINGS,
      saved: false,
    });

    const res = await GET();

    expect(await res.json()).toEqual({
      settings: DEFAULT_NOTIFICATION_SETTINGS,
      saved: false,
    });
    expect(mocks.getNotificationSettings).toHaveBeenCalledWith('7');
  });

  it.each([
    ['24시', { dailyHour: 24 }],
    ['7번째 요일', { weeklyDay: 7 }],
    ['소수 시각', { weeklyHour: 8.5 }],
    ['빈 요청', {}],
  ])('%s은 400이고 저장하지 않는다', async (_name, body) => {
    expect((await PATCH(json('PATCH', body))).status).toBe(400);
    expect(mocks.saveNotificationSettings).not.toHaveBeenCalled();
  });

  it('보낸 항목만 저장한다', async () => {
    const saved = { ...DEFAULT_NOTIFICATION_SETTINGS, dailyHour: 17 };
    mocks.saveNotificationSettings.mockResolvedValue(saved);

    const res = await PATCH(json('PATCH', { dailyHour: 17 }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ settings: saved, saved: true });
    expect(mocks.saveNotificationSettings).toHaveBeenCalledWith('7', {
      dailyHour: 17,
    });
  });
});

describe('PUT /api/fridges/[id]/notify-level', () => {
  it('정해진 수준이 아니면 400이다', async () => {
    const res = await PUT_LEVEL(json('PUT', { level: 'loud' }), params('5'));

    expect(res.status).toBe(400);
    expect(mocks.setNotifyLevel).not.toHaveBeenCalled();
  });

  it('구성원이 아닌 냉장고면 404다', async () => {
    mocks.setNotifyLevel.mockResolvedValue(false);

    const res = await PUT_LEVEL(json('PUT', { level: 'all' }), params('9'));

    expect(res.status).toBe(404);
    expect(mocks.setNotifyLevel).toHaveBeenCalledWith('7', '9', 'all');
  });

  it('내 알림 수준을 바꾼다', async () => {
    mocks.setNotifyLevel.mockResolvedValue(true);

    expect(
      (await PUT_LEVEL(json('PUT', { level: 'none' }), params('5'))).status,
    ).toBe(204);
  });
});

describe('/api/items/[id]/watch', () => {
  it('켜기와 끄기를 로그인 사용자 기준으로 저장한다', async () => {
    mocks.setItemWatched.mockResolvedValue(true);

    expect((await WATCH(json('PUT', null), params('1'))).status).toBe(204);
    expect((await UNWATCH(json('DELETE', null), params('1'))).status).toBe(204);
    expect(mocks.setItemWatched.mock.calls).toEqual([
      ['7', '1', true],
      ['7', '1', false],
    ]);
  });

  it('구성원이 아닌 냉장고의 품목이거나 잘못된 번호면 404다', async () => {
    mocks.setItemWatched.mockResolvedValue(false);

    expect((await WATCH(json('PUT', null), params('99'))).status).toBe(404);
    expect((await WATCH(json('PUT', null), params('abc'))).status).toBe(404);
    expect(mocks.setItemWatched).toHaveBeenCalledTimes(1);
  });
});
