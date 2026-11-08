// @vitest-environment node
// app/api/recipes/today/route.test.ts

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { currentPolicyVersion } from '@/app/lib/consent/policies';
import { recipeCacheKey } from '@/app/lib/recipes/today';
import { GET, POST } from './route';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getFridgeRole: vi.fn(),
  listItems: vi.fn(),
  generateRecipe: vi.fn(),
  findRecipeByKey: vi.fn(),
  saveRecipe: vi.fn(),
  countRecentGenerations: vi.fn(),
  recordGeneration: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/app/lib/fridges/store', async importOriginal => ({
  ...(await importOriginal<typeof import('@/app/lib/fridges/store')>()),
  getFridgeRole: mocks.getFridgeRole,
}));
vi.mock('@/app/lib/items/store', () => ({ listItems: mocks.listItems }));
vi.mock('@/app/lib/recipes/generateRecipe', () => ({
  generateRecipe: mocks.generateRecipe,
}));
vi.mock('@/app/lib/recipes/store', () => ({
  findRecipeByKey: mocks.findRecipeByKey,
  saveRecipe: mocks.saveRecipe,
  countRecentGenerations: mocks.countRecentGenerations,
  recordGeneration: mocks.recordGeneration,
}));

const today = new Date().toISOString().slice(0, 10);
const tofu = {
  id: '1',
  name: '두부',
  category: 'fridge',
  quantity: 1,
  finished: false,
  expiryDate: today,
};
const stored = {
  id: '9',
  title: '두부 부침',
  minutes: 10,
  caution: null,
  steps: [{ text: '굽는다' }],
  ingredients: [{ name: '두부', amount: '1모', have: true }],
};
const post = () =>
  POST(
    new Request('http://localhost/api/recipes/today', {
      method: 'POST',
      body: JSON.stringify({ fridgeId: '5', agreed: true }),
    }),
  );
const get = () =>
  GET(new Request('http://localhost/api/recipes/today?fridgeId=5'));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('RECIPE_PREVIEW_USER_IDS', '7');
  vi.stubEnv('RECIPES_ENABLED', '');
  mocks.auth.mockResolvedValue({
    registered: true,
    consentVersion: currentPolicyVersion(),
    user: { id: '7' },
  });
  mocks.getFridgeRole.mockResolvedValue('owner');
  mocks.listItems.mockResolvedValue([tofu]);
  mocks.findRecipeByKey.mockResolvedValue(null);
  mocks.countRecentGenerations.mockResolvedValue(0);
});
afterEach(() => vi.unstubAllEnvs());

describe('/api/recipes/today', () => {
  it('방침(2026-11-09) 시행 전에는 지정한 사람이 아니면 카드를 숨기고 만들지도 않는다', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-08T21:00:00+09:00'));
    mocks.auth.mockResolvedValue({
      registered: true,
      consentVersion: currentPolicyVersion(),
      user: { id: '8' },
    });
    expect(await (await get()).json()).toEqual({ available: false });
    expect((await post()).status).toBe(404);
    expect(mocks.generateRecipe).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('방침 시행 뒤에는 모두에게 열고, 해외로 보내는 데 동의하지 않은 만들기 요청은 받지 않는다', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-09T09:00:00+09:00'));
    mocks.auth.mockResolvedValue({
      registered: true,
      consentVersion: currentPolicyVersion(),
      user: { id: '8' },
    });
    expect((await (await get()).json()).available).toBe(true);
    const withoutConsent = await POST(
      new Request('http://localhost/api/recipes/today', {
        method: 'POST',
        body: JSON.stringify({ fridgeId: '5' }),
      }),
    );
    expect(withoutConsent.status).toBe(400);
    expect(mocks.generateRecipe).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('GET은 저장된 레시피만 찾고 새로 만들지 않는다', async () => {
    const body = await (await get()).json();
    expect(body).toEqual({
      available: true,
      soonNames: ['두부'],
      recipe: null,
    });
    expect(mocks.findRecipeByKey).toHaveBeenCalledWith(
      recipeCacheKey(['두부']),
    );
    expect(mocks.generateRecipe).not.toHaveBeenCalled();
  });

  it('저장된 레시피가 있으면 만들지 않고 돌려준다 (횟수도 세지 않음)', async () => {
    mocks.findRecipeByKey.mockResolvedValue(stored);
    const res = await post();
    expect(res.status).toBe(200);
    expect((await res.json()).usedItemIds).toEqual(['1']);
    expect(mocks.generateRecipe).not.toHaveBeenCalled();
    expect(mocks.recordGeneration).not.toHaveBeenCalled();
  });

  it('하루 횟수를 넘으면 429이고 만들지 않는다', async () => {
    mocks.countRecentGenerations.mockResolvedValue(5);
    expect((await post()).status).toBe(429);
    expect(mocks.generateRecipe).not.toHaveBeenCalled();
  });

  it('곧 먹어야 할 재료로만 새로 만들고 저장한다', async () => {
    mocks.listItems.mockResolvedValue([
      tofu,
      { ...tofu, id: '2', name: '우유', expiryDate: '2099-01-01' },
    ]);
    mocks.generateRecipe.mockResolvedValue({ status: 'ok', recipe: stored });
    mocks.saveRecipe.mockResolvedValue(stored);
    const res = await post();
    expect(res.status).toBe(201);
    expect(mocks.generateRecipe).toHaveBeenCalledWith(['두부'], ['우유']);
    expect(mocks.recordGeneration).toHaveBeenCalledWith('7', 'recipe');
  });

  it('곧 먹어야 할 재료가 없으면 만들지 않는다', async () => {
    mocks.listItems.mockResolvedValue([{ ...tofu, expiryDate: '2099-01-01' }]);
    expect((await post()).status).toBe(409);
    expect(mocks.generateRecipe).not.toHaveBeenCalled();
  });
});
