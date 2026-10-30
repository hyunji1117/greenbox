// @vitest-environment node
// app/api/items/route.test.ts

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POLICY_VERSION } from '@/app/lib/consent/policies';
import { toItemJson, type ItemRow } from '@/app/lib/items/store';
import { ItemSchema } from '@/app/lib/schemas/item';
import { POST as POST_COMMENT } from './[id]/comments/route';
import { PATCH } from './[id]/route';
import { GET, POST } from './route';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  listItems: vi.fn(),
  createItem: vi.fn(),
  updateItem: vi.fn(),
  addComment: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/app/lib/items/store', async importOriginal => ({
  ...(await importOriginal<typeof import('@/app/lib/items/store')>()),
  listItems: mocks.listItems,
  createItem: mocks.createItem,
  updateItem: mocks.updateItem,
  addComment: mocks.addComment,
}));

const row: ItemRow = {
  id: '1',
  name: '우유',
  category: 'fridge',
  quantity: 1,
  added_by: 'mom',
  created_at: new Date('2026-10-30T03:00:00.000Z'),
  finished: false,
  expiry_date: '2026-11-05',
  comments: [
    {
      id: '101',
      text: '내일 먹을거야',
      author: 'littleKid',
      createdAt: '2026-10-30T04:00:00.123456+00:00',
    },
  ],
};

const jsonRequest = (body: string) =>
  new Request('http://localhost/api/items', { method: 'POST', body });
const params = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({
    registered: true,
    consentVersion: POLICY_VERSION,
    user: { id: '7' },
  });
});

describe('서버 응답과 클라이언트 스키마의 계약', () => {
  it('toItemJson 결과가 ItemSchema를 통과한다', () => {
    expect(ItemSchema.safeParse(toItemJson(row)).success).toBe(true);
  });
});

describe('/api/items 권한', () => {
  it('로그인하지 않으면 401이고 DB를 조회하지 않는다', async () => {
    mocks.auth.mockResolvedValue(null);

    const res = await GET();

    expect(res.status).toBe(401);
    expect(mocks.listItems).not.toHaveBeenCalled();
  });

  it('현재 방침에 동의하지 않았으면 403이다', async () => {
    mocks.auth.mockResolvedValue({
      registered: true,
      consentVersion: 'old',
      user: { id: '7' },
    });

    expect((await GET()).status).toBe(403);
  });

  it('로그인한 사용자 id로만 목록을 조회한다', async () => {
    mocks.listItems.mockResolvedValue([]);

    expect((await GET()).status).toBe(200);
    expect(mocks.listItems).toHaveBeenCalledWith('7');
  });
});

describe('POST /api/items', () => {
  it('JSON이 아닌 본문은 400이다', async () => {
    const res = await POST(jsonRequest('not-json'));

    expect(res.status).toBe(400);
    expect(mocks.createItem).not.toHaveBeenCalled();
  });

  it('잘못된 필드는 400과 필드 에러를 돌려준다', async () => {
    const res = await POST(
      jsonRequest(
        JSON.stringify({
          name: '',
          category: 'fridge',
          quantity: 1,
          addedBy: 'mom',
        }),
      ),
    );

    expect(res.status).toBe(400);
    expect((await res.json()).fields.name).toBeDefined();
  });

  it('정상 요청은 앞뒤 공백을 지우고 201로 저장한다', async () => {
    mocks.createItem.mockResolvedValue(toItemJson(row));

    const res = await POST(
      jsonRequest(
        JSON.stringify({
          name: ' 우유 ',
          category: 'fridge',
          quantity: 1,
          addedBy: 'mom',
        }),
      ),
    );

    expect(res.status).toBe(201);
    expect(mocks.createItem).toHaveBeenCalledWith(
      '7',
      expect.objectContaining({ name: '우유' }),
    );
  });
});

describe('PATCH /api/items/[id]', () => {
  const patch = (id: string, body: unknown) =>
    PATCH(
      new Request('http://localhost/api/items/1', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
      params(id),
    );

  it('내 품목이 아니면 404다', async () => {
    mocks.updateItem.mockResolvedValue(null);

    expect((await patch('999', { finished: true })).status).toBe(404);
    expect(mocks.updateItem).toHaveBeenCalledWith('7', '999', {
      finished: true,
    });
  });
});

describe('POST /api/items/[id]/comments', () => {
  const postComment = (id: string, body: unknown) =>
    POST_COMMENT(
      new Request('http://localhost/api/items/1/comments', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
      params(id),
    );

  it('공백뿐인 댓글은 400이다', async () => {
    const res = await postComment('1', { text: '   ', author: 'mom' });

    expect(res.status).toBe(400);
    expect(mocks.addComment).not.toHaveBeenCalled();
  });

  it('내 품목이 아니면 404다', async () => {
    mocks.addComment.mockResolvedValue(null);

    const res = await postComment('999', { text: '맛있다', author: 'mom' });

    expect(res.status).toBe(404);
    expect(mocks.addComment).toHaveBeenCalledWith('7', '999', {
      text: '맛있다',
      author: 'mom',
    });
  });
});
