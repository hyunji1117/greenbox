// @vitest-environment node
// app/api/fridges/[id]/shelves/auto-place/route.test.ts

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  requireFridgeMember: vi.fn(),
  getShelfSettings: vi.fn(),
  applyAutoPlacement: vi.fn(),
  listItems: vi.fn(),
}));

vi.mock('@/app/api/items/guard', () => ({
  requireUser: mocks.requireUser,
  requireFridgeMember: mocks.requireFridgeMember,
  notFound: () => NextResponse.json({}, { status: 404 }),
}));
vi.mock('@/app/lib/shelves/store', () => ({
  getShelfSettings: mocks.getShelfSettings,
  applyAutoPlacement: mocks.applyAutoPlacement,
}));
vi.mock('@/app/lib/items/store', () => ({ listItems: mocks.listItems }));

import { POST } from './route';

const json = (id: string, name: string, shelf: number | null) => ({
  id,
  name,
  category: 'fridge',
  quantity: 1,
  eatenQuantity: 0,
  addedBy: { id: '7', name: '현지', isMember: true },
  addedAt: '2026-11-10T00:00:00.000Z',
  comments: [],
  finished: false,
  expiryDate: '2026-11-30',
  watched: false,
  unit: null,
  shelf,
  autoPlaced: false,
  updatedAt: null,
});

const call = () =>
  POST(new Request('http://localhost', { method: 'POST' }), {
    params: Promise.resolve({ id: '5' }),
  });

describe('POST /api/fridges/[id]/shelves/auto-place', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({ userId: '7' });
    mocks.requireFridgeMember.mockResolvedValue({});
  });

  it('선반 보기가 꺼진 냉장고는 놓지 않는다', async () => {
    mocks.getShelfSettings.mockResolvedValue({
      enabled: false,
      counts: { fridge: 5, freezer: 3, pantry: 2 },
    });
    const res = await call();
    expect(res.status).toBe(409);
    expect(mocks.applyAutoPlacement).not.toHaveBeenCalled();
  });

  it('선반 없는 품목만 추천 자리로 놓고 놓은 수를 돌려준다', async () => {
    mocks.getShelfSettings.mockResolvedValue({
      enabled: true,
      counts: { fridge: 5, freezer: 3, pantry: 2 },
    });
    mocks.listItems.mockResolvedValue([
      json('1', '오이', null),
      json('2', '우유', 2),
    ]);
    mocks.applyAutoPlacement.mockResolvedValue(1);
    const res = await call();
    expect(await res.json()).toEqual({ placed: 1 });
    expect(mocks.applyAutoPlacement).toHaveBeenCalledWith('5', [
      { id: '1', shelf: 5 },
    ]);
  });

  it('구성원이 아니면 그 응답을 그대로 돌려준다', async () => {
    mocks.requireFridgeMember.mockResolvedValue({
      response: NextResponse.json({}, { status: 404 }),
    });
    expect((await call()).status).toBe(404);
  });
});
