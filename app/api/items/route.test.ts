// @vitest-environment node
// app/api/items/route.test.ts

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { currentPolicyVersion } from '@/app/lib/consent/policies';
import { toItemJson, type ItemRow } from '@/app/lib/items/store';
import { ItemSchema } from '@/app/lib/schemas/item';
import { PATCH as PATCH_COMMENT } from './[id]/comments/[commentId]/route';
import { POST as POST_COMMENT } from './[id]/comments/route';
import { PATCH } from './[id]/route';
import { GET, POST } from './route';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getFridgeRole: vi.fn(),
  listItems: vi.fn(),
  createItem: vi.fn(),
  updateItem: vi.fn(),
  addComment: vi.fn(),
  updateComment: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/app/lib/fridges/store', async importOriginal => ({
  ...(await importOriginal<typeof import('@/app/lib/fridges/store')>()),
  getFridgeRole: mocks.getFridgeRole,
}));
vi.mock('@/app/lib/items/store', async importOriginal => ({
  ...(await importOriginal<typeof import('@/app/lib/items/store')>()),
  listItems: mocks.listItems,
  createItem: mocks.createItem,
  updateItem: mocks.updateItem,
  addComment: mocks.addComment,
  updateComment: mocks.updateComment,
}));

const row: ItemRow = {
  id: '1',
  name: '우유',
  category: 'fridge',
  quantity: 1,
  eaten_quantity: 0,
  added_by: { id: '7', name: '현지', isMember: true },
  created_at: new Date('2026-10-30T03:00:00.000Z'),
  finished: false,
  expiry_date: '2026-11-05',
  watched: true,
  comments: [
    {
      id: '101',
      text: '내일 먹을거야',
      // 냉장고에서 나간 구성원의 댓글
      author: { id: '8', name: '낭농', isMember: false },
      createdAt: '2026-10-30T04:00:00.123456+00:00',
      editedAt: '2026-10-30T05:00:00.5+00:00',
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
    consentVersion: currentPolicyVersion(),
    user: { id: '7' },
  });
  // 기본은 냉장고 5번의 구성원
  mocks.getFridgeRole.mockImplementation(async (_userId, fridgeId) =>
    fridgeId === '5' ? 'owner' : null,
  );
});

const getList = (fridgeId?: string) =>
  GET(
    new Request(
      `http://localhost/api/items${fridgeId ? `?fridgeId=${fridgeId}` : ''}`,
    ),
  );

describe('서버 응답과 클라이언트 스키마의 계약', () => {
  it('toItemJson 결과가 ItemSchema를 통과한다', () => {
    expect(ItemSchema.safeParse(toItemJson(row)).success).toBe(true);
  });

  it('고친 시각은 Date로, 고친 적 없거나 이전 서버 응답이면 null로 읽는다', () => {
    const item = ItemSchema.parse(toItemJson(row));
    expect(item.comments[0].editedAt).toEqual(
      new Date('2026-10-30T05:00:00.500Z'),
    );
    const oldComment: Record<string, unknown> = {
      ...toItemJson(row).comments[0],
    };
    delete oldComment.editedAt;
    const old = ItemSchema.parse({
      ...toItemJson(row),
      comments: [oldComment],
    });
    expect(old.comments[0].editedAt).toBeNull();
  });
});

describe('/api/items 권한', () => {
  it('로그인하지 않으면 401이고 DB를 조회하지 않는다', async () => {
    mocks.auth.mockResolvedValue(null);

    const res = await getList('5');

    expect(res.status).toBe(401);
    expect(mocks.listItems).not.toHaveBeenCalled();
  });

  it('현재 방침에 동의하지 않았으면 403이다', async () => {
    mocks.auth.mockResolvedValue({
      registered: true,
      consentVersion: 'old',
      user: { id: '7' },
    });

    expect((await getList('5')).status).toBe(403);
  });

  it('구성원인 냉장고의 목록만 조회한다', async () => {
    mocks.listItems.mockResolvedValue([]);

    expect((await getList('5')).status).toBe(200);
    expect(mocks.getFridgeRole).toHaveBeenCalledWith('7', '5');
    expect(mocks.listItems).toHaveBeenCalledWith('5', '7');
  });

  it('구성원이 아닌 냉장고는 있는지도 알리지 않도록 404이고 조회하지 않는다', async () => {
    expect((await getList('6')).status).toBe(404);
    expect(mocks.listItems).not.toHaveBeenCalled();
  });

  it('냉장고 번호가 없거나 형식이 틀리면 404다', async () => {
    expect((await getList()).status).toBe(404);
    expect((await getList('abc')).status).toBe(404);
    expect(mocks.getFridgeRole).not.toHaveBeenCalled();
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
          fridgeId: '5',
        }),
      ),
    );

    expect(res.status).toBe(400);
    expect((await res.json()).fields.name).toBeDefined();
  });

  it('정상 요청은 앞뒤 공백을 지우고 로그인 사용자를 넣은 사람으로 201 저장한다', async () => {
    mocks.createItem.mockResolvedValue(toItemJson(row));

    const res = await POST(
      jsonRequest(
        JSON.stringify({
          name: ' 우유 ',
          category: 'fridge',
          quantity: 1,
          fridgeId: '5',
          // 다른 사람 이름으로 기록하려 해도 무시된다
          addedBy: 'dad',
        }),
      ),
    );

    expect(res.status).toBe(201);
    expect(mocks.createItem).toHaveBeenCalledWith('5', '7', {
      name: '우유',
      category: 'fridge',
      quantity: 1,
      // 유통기한을 비워 두면 권장 보관 기간(우유 냉장 5일)으로 채운다
      expiryDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    });
  });

  it('유통기한을 비워 두면 오늘(한국 날짜)부터 권장 일수 뒤로 채우고, 직접 넣은 날짜는 그대로 둔다', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    // 2026-11-08 09:00 KST
    vi.setSystemTime(new Date('2026-11-08T00:00:00Z'));
    mocks.createItem.mockResolvedValue(toItemJson(row));
    const post = (body: object) =>
      POST(
        jsonRequest(JSON.stringify({ quantity: 1, fridgeId: '5', ...body })),
      );

    await post({ name: '두부', category: 'fridge' });
    await post({ name: '두부', category: 'fridge', expiryDate: '2026-11-20' });
    vi.useRealTimers();

    expect(mocks.createItem.mock.calls.map(call => call[2].expiryDate)).toEqual(
      ['2026-11-11', '2026-11-20'],
    );
  });

  it('구성원이 아닌 냉장고에는 넣지 않고 404다', async () => {
    const res = await POST(
      jsonRequest(
        JSON.stringify({
          name: '우유',
          category: 'fridge',
          quantity: 1,
          fridgeId: '6',
        }),
      ),
    );

    expect(res.status).toBe(404);
    expect(mocks.createItem).not.toHaveBeenCalled();
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

  it('구성원인 냉장고의 품목이 아니면 404다', async () => {
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
    const res = await postComment('1', { text: '   ' });

    expect(res.status).toBe(400);
    expect(mocks.addComment).not.toHaveBeenCalled();
  });

  it('구성원인 냉장고의 품목이 아니면 404이고, 본문의 작성자는 무시한다', async () => {
    mocks.addComment.mockResolvedValue(null);

    const res = await postComment('999', { text: '맛있다', author: 'dad' });

    expect(res.status).toBe(404);
    expect(mocks.addComment).toHaveBeenCalledWith('7', '999', {
      text: '맛있다',
    });
  });
});

describe('PATCH /api/items/[id]/comments/[commentId]', () => {
  const patchComment = (id: string, commentId: string, body: unknown) =>
    PATCH_COMMENT(
      new Request(`http://localhost/api/items/${id}/comments/${commentId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ id, commentId }) },
    );

  it('로그인하지 않으면 401이다', async () => {
    mocks.auth.mockResolvedValue(null);

    expect((await patchComment('1', '101', { text: '고침' })).status).toBe(401);
    expect(mocks.updateComment).not.toHaveBeenCalled();
  });

  it('공백뿐인 내용이나 잘못된 댓글 번호는 고치지 않는다', async () => {
    expect((await patchComment('1', '101', { text: '  ' })).status).toBe(400);
    expect((await patchComment('1', 'abc', { text: '고침' })).status).toBe(404);
    expect(mocks.updateComment).not.toHaveBeenCalled();
  });

  it('내가 쓴 댓글이 아니면 404다', async () => {
    mocks.updateComment.mockResolvedValue(null);

    expect((await patchComment('1', '101', { text: '고침' })).status).toBe(404);
    expect(mocks.updateComment).toHaveBeenCalledWith('7', '1', '101', {
      text: '고침',
    });
  });

  it('고친 댓글을 돌려준다', async () => {
    const comment = {
      id: '101',
      text: '고침',
      author: { id: '7', name: '현지', isMember: true },
      createdAt: '2026-10-30T04:00:00.000Z',
      editedAt: '2026-10-30T06:00:00.000Z',
    };
    mocks.updateComment.mockResolvedValue(comment);

    const res = await patchComment('1', '101', { text: ' 고침 ' });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(comment);
    expect(mocks.updateComment).toHaveBeenCalledWith('7', '1', '101', {
      text: '고침',
    });
  });
});
