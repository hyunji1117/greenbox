// @vitest-environment node
// app/api/items/recognize/route.test.ts

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { currentPolicyVersion } from '@/app/lib/consent/policies';
import { normalizeRecognized } from '@/app/lib/vision/recognizeIngredients';
import { POST } from './route';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  recognize: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/app/lib/vision/recognizeIngredients', async importOriginal => ({
  ...(await importOriginal<
    typeof import('@/app/lib/vision/recognizeIngredients')
  >()),
  recognizeIngredients: mocks.recognize,
}));

const post = (body: unknown) =>
  POST(
    new Request('http://localhost/api/items/recognize', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  );
const photo = { image: 'aGVsbG8=', mediaType: 'image/jpeg' };

let userId = 100;
beforeEach(() => {
  vi.clearAllMocks();
  // 요청 횟수 제한이 테스트끼리 섞이지 않게 테스트마다 다른 사용자로 보낸다
  userId += 1;
  mocks.auth.mockResolvedValue({
    registered: true,
    consentVersion: currentPolicyVersion(),
    user: { id: String(userId) },
  });
});

describe('POST /api/items/recognize', () => {
  it('로그인하지 않으면 사진을 보내지 않는다', async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await post(photo)).status).toBe(401);
    expect(mocks.recognize).not.toHaveBeenCalled();
  });

  it('base64가 아니거나 지원하지 않는 형식이면 400', async () => {
    expect((await post({ ...photo, image: 'not base64!' })).status).toBe(400);
    expect((await post({ ...photo, mediaType: 'image/gif' })).status).toBe(400);
    expect(mocks.recognize).not.toHaveBeenCalled();
  });

  it('찾은 후보를 돌려준다', async () => {
    mocks.recognize.mockResolvedValue({
      status: 'ok',
      items: [{ name: '우유', category: 'fridge', quantity: 2 }],
    });
    const res = await post(photo);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      items: [{ name: '우유', category: 'fridge', quantity: 2 }],
    });
    expect(mocks.recognize).toHaveBeenCalledWith('aGVsbG8=', 'image/jpeg');
  });

  it('키가 없어 기능이 꺼져 있으면 503, 인식에 실패하면 502', async () => {
    mocks.recognize.mockResolvedValueOnce({ status: 'unavailable' });
    expect((await post(photo)).status).toBe(503);
    mocks.recognize.mockResolvedValueOnce({ status: 'failed' });
    expect((await post(photo)).status).toBe(502);
  });

  it('한 사람이 한 시간에 30번을 넘게 보내면 막는다', async () => {
    mocks.recognize.mockResolvedValue({ status: 'ok', items: [] });
    for (let i = 0; i < 30; i += 1) {
      expect((await post(photo)).status).toBe(200);
    }
    expect((await post(photo)).status).toBe(429);
    expect(mocks.recognize).toHaveBeenCalledTimes(30);
  });
});

describe('normalizeRecognized', () => {
  it('빈 이름은 빼고, 같은 이름은 수량을 합치고, 수량을 1~99로 맞춘다', () => {
    expect(
      normalizeRecognized([
        { name: ' 양파 ', category: 'pantry', quantity: 2 },
        { name: '양파', category: 'pantry', quantity: 3 },
        { name: '  ', category: 'fridge', quantity: 1 },
        { name: '계란', category: 'fridge', quantity: 300 },
        { name: '두부', category: 'fridge', quantity: 0 },
      ]),
    ).toEqual([
      { name: '양파', category: 'pantry', quantity: 5 },
      { name: '계란', category: 'fridge', quantity: 99 },
      { name: '두부', category: 'fridge', quantity: 1 },
    ]);
  });

  it('후보는 20개까지만 돌려준다', () => {
    const many = Array.from({ length: 25 }, (_, i) => ({
      name: `품목${i}`,
      category: 'fridge' as const,
      quantity: 1,
    }));
    expect(normalizeRecognized(many)).toHaveLength(20);
  });
});
