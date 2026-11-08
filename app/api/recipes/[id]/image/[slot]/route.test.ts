// @vitest-environment node
// app/api/recipes/[id]/image/[slot]/route.test.ts

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { currentPolicyVersion } from '@/app/lib/consent/policies';
import { GET } from './route';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  generateImage: vi.fn(),
  getRecipe: vi.fn(),
  getRecipeImage: vi.fn(),
  saveRecipeImage: vi.fn(),
  countRecentGenerations: vi.fn(),
  recordGeneration: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/app/lib/recipes/generateImage', async importOriginal => ({
  ...(await importOriginal<typeof import('@/app/lib/recipes/generateImage')>()),
  generateImage: mocks.generateImage,
}));
vi.mock('@/app/lib/recipes/store', () => ({
  getRecipe: mocks.getRecipe,
  getRecipeImage: mocks.getRecipeImage,
  saveRecipeImage: mocks.saveRecipeImage,
  countRecentGenerations: mocks.countRecentGenerations,
  recordGeneration: mocks.recordGeneration,
}));

const get = (slot: string) =>
  GET(new Request(`http://localhost/api/recipes/9/image/${slot}`), {
    params: Promise.resolve({ id: '9', slot }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('RECIPE_PREVIEW_USER_IDS', '7');
  mocks.auth.mockResolvedValue({
    registered: true,
    consentVersion: currentPolicyVersion(),
    user: { id: '7' },
  });
  mocks.getRecipeImage.mockResolvedValue(null);
  mocks.countRecentGenerations.mockResolvedValue(0);
  mocks.getRecipe.mockResolvedValue({
    id: '9',
    title: '두부 부침',
    minutes: 10,
    caution: null,
    steps: [{ text: '두부를 굽는다' }],
    ingredients: [{ name: '두부', amount: '1모', have: true }],
  });
});
afterEach(() => vi.unstubAllEnvs());

describe('/api/recipes/[id]/image/[slot]', () => {
  it('저장된 그림이 있으면 만들지 않고 돌려준다', async () => {
    mocks.getRecipeImage.mockResolvedValue({
      mime: 'image/webp',
      content: Buffer.from('abc'),
    });
    const res = await get('0');
    expect(res.headers.get('content-type')).toBe('image/webp');
    expect(mocks.generateImage).not.toHaveBeenCalled();
  });

  it('완성 사진은 중간 품질, 단계 그림은 낮은 품질로 만들고 저장한다', async () => {
    mocks.generateImage.mockResolvedValue({
      status: 'ok',
      mime: 'image/webp',
      content: Buffer.from('img'),
    });
    await get('0');
    await get('1');
    expect(mocks.generateImage.mock.calls.map(call => call[1])).toEqual([
      'medium',
      'low',
    ]);
    expect(mocks.generateImage.mock.calls[1][0]).toContain('두부를 굽는다');
    expect(mocks.saveRecipeImage).toHaveBeenCalledTimes(2);
  });

  it('없는 단계나 하루 횟수 초과, 지정하지 않은 사람은 만들지 않는다', async () => {
    expect((await get('5')).status).toBe(404);
    mocks.countRecentGenerations.mockResolvedValue(20);
    expect((await get('0')).status).toBe(429);
    mocks.countRecentGenerations.mockResolvedValue(0);
    // 레시피를 넣은 방침(2026-11-09) 시행 전에는 지정한 사람만
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-08T21:00:00+09:00'));
    vi.stubEnv('RECIPE_PREVIEW_USER_IDS', '');
    expect((await get('0')).status).toBe(404);
    vi.useRealTimers();
    expect(mocks.generateImage).not.toHaveBeenCalled();
  });
});
