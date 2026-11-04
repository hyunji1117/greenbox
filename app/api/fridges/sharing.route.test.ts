// @vitest-environment node
// app/api/fridges/sharing.route.test.ts
// 냉장고 함께 쓰기 API의 권한. 실제 SQL은 로컬 임시 DB 통합 테스트로 따로 확인한다

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { currentPolicyVersion } from '@/app/lib/consent/policies';
import { POST as JOIN } from '@/app/api/join/[code]/route';
import { PUT as SWITCH } from './current/route';
import { GET as GET_INVITE, POST as CREATE_INVITE } from './[id]/invite/route';
import { POST as LEAVE } from './[id]/leave/route';
import { DELETE as REMOVE } from './[id]/members/[userId]/route';
import { POST as DECIDE } from './[id]/requests/[requestId]/route';
import { GET as LIST_REQUESTS } from './[id]/requests/route';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getFridgeRole: vi.fn(),
  createInvite: vi.fn(),
  getActiveInvite: vi.fn(),
  listPendingRequests: vi.fn(),
  decideRequest: vi.fn(),
  removeMember: vi.fn(),
  leaveFridge: vi.fn(),
  requestToJoin: vi.fn(),
  switchCurrentFridge: vi.fn(),
  sendPushToUsers: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/app/lib/fridges/store', async importOriginal => ({
  ...(await importOriginal<typeof import('@/app/lib/fridges/store')>()),
  getFridgeRole: mocks.getFridgeRole,
  getCurrentFridge: vi.fn(),
}));
vi.mock('@/app/lib/fridges/sharing', () => ({
  createInvite: mocks.createInvite,
  getActiveInvite: mocks.getActiveInvite,
  revokeInvites: vi.fn(),
  listPendingRequests: mocks.listPendingRequests,
  decideRequest: mocks.decideRequest,
  removeMember: mocks.removeMember,
  leaveFridge: mocks.leaveFridge,
  requestToJoin: mocks.requestToJoin,
  switchCurrentFridge: mocks.switchCurrentFridge,
  getNamesForNotice: async () => ({
    fridgeName: '본가 냉장고',
    userName: '낭농',
  }),
  listOtherMemberIds: async () => ['1'],
}));
vi.mock('@/app/lib/push/sendToUsers', () => ({
  sendPushToUsers: mocks.sendPushToUsers,
}));

const req = (body?: unknown) =>
  new Request('http://localhost/api', {
    method: 'POST',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const ctx = <T extends Record<string, string>>(params: T) => ({
  params: Promise.resolve(params),
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({
    registered: true,
    consentVersion: currentPolicyVersion(),
    user: { id: '7' },
  });
  // 사용자 7은 냉장고 5번의 일반 구성원
  mocks.getFridgeRole.mockImplementation(async (_userId, fridgeId) =>
    fridgeId === '5' ? 'member' : null,
  );
});

describe('구성원이 아닌 냉장고는 있는지도 알리지 않는다 (404)', () => {
  it('초대 링크 조회와 만들기', async () => {
    expect((await GET_INVITE(req(), ctx({ id: '6' }))).status).toBe(404);
    expect((await CREATE_INVITE(req(), ctx({ id: '6' }))).status).toBe(404);
    expect(mocks.createInvite).not.toHaveBeenCalled();
  });

  it('참여 요청 목록과 승인', async () => {
    expect((await LIST_REQUESTS(req(), ctx({ id: '6' }))).status).toBe(404);
    const res = await DECIDE(
      req({ decision: 'approve' }),
      ctx({ id: '6', requestId: '1' }),
    );
    expect(res.status).toBe(404);
    expect(mocks.decideRequest).not.toHaveBeenCalled();
  });

  it('구성원인 냉장고에서는 초대 링크를 만든다', async () => {
    mocks.createInvite.mockResolvedValue({
      code: 'x'.repeat(32),
      expiresAt: new Date().toISOString(),
    });
    expect((await CREATE_INVITE(req(), ctx({ id: '5' }))).status).toBe(201);
    expect(mocks.createInvite).toHaveBeenCalledWith('7', '5');
  });
});

describe('내보내기', () => {
  it('만든 사람이 아니면 403이고 아무도 내보내지 않는다', async () => {
    const res = await REMOVE(req(), ctx({ id: '5', userId: '8' }));
    expect(res.status).toBe(403);
    expect(mocks.removeMember).not.toHaveBeenCalled();
  });

  it('만든 사람은 구성원을 내보내고, 만든 사람 자신은 내보낼 수 없다', async () => {
    mocks.getFridgeRole.mockResolvedValue('owner');
    mocks.removeMember.mockResolvedValueOnce('removed');
    expect((await REMOVE(req(), ctx({ id: '5', userId: '8' }))).status).toBe(
      204,
    );
    mocks.removeMember.mockResolvedValueOnce('owner');
    expect((await REMOVE(req(), ctx({ id: '5', userId: '7' }))).status).toBe(
      409,
    );
  });
});

describe('승인', () => {
  it('승인하면 요청한 사람에게 알리고, 결과를 돌려준다', async () => {
    mocks.decideRequest.mockResolvedValue({
      status: 'approved',
      requesterId: '9',
    });
    const res = await DECIDE(
      req({ decision: 'approve' }),
      ctx({ id: '5', requestId: '3' }),
    );
    expect(res.status).toBe(200);
    expect(mocks.decideRequest).toHaveBeenCalledWith('7', '5', '3', true);
    expect(mocks.sendPushToUsers).toHaveBeenCalledWith(
      ['9'],
      expect.objectContaining({ title: '참여가 승인됐어요' }),
    );
  });

  it('이미 처리했거나 만료된 요청은 404, 요청한 사람이 5개를 넘으면 409', async () => {
    mocks.decideRequest.mockResolvedValueOnce({ status: 'not_found' });
    expect(
      (
        await DECIDE(
          req({ decision: 'reject' }),
          ctx({ id: '5', requestId: '3' }),
        )
      ).status,
    ).toBe(404);
    mocks.decideRequest.mockResolvedValueOnce({ status: 'limit' });
    expect(
      (
        await DECIDE(
          req({ decision: 'approve' }),
          ctx({ id: '5', requestId: '3' }),
        )
      ).status,
    ).toBe(409);
  });

  it('승인과 거절 외의 값은 400이다', async () => {
    const res = await DECIDE(
      req({ decision: 'maybe' }),
      ctx({ id: '5', requestId: '3' }),
    );
    expect(res.status).toBe(400);
  });
});

describe('참여 요청', () => {
  it('로그인하지 않으면 401이다', async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await JOIN(req(), ctx({ code: 'x'.repeat(32) }))).status).toBe(401);
  });

  it('쓸 수 없는 링크는 404, 냉장고 5개를 넘으면 409', async () => {
    mocks.requestToJoin.mockResolvedValueOnce({ status: 'invalid' });
    expect((await JOIN(req(), ctx({ code: 'bad' }))).status).toBe(404);
    mocks.requestToJoin.mockResolvedValueOnce({ status: 'limit' });
    expect((await JOIN(req(), ctx({ code: 'x'.repeat(32) }))).status).toBe(409);
  });

  it('새 요청이면 구성원에게 알리고, 같은 요청을 다시 보내면 알리지 않는다', async () => {
    mocks.requestToJoin.mockResolvedValueOnce({
      status: 'pending',
      fridgeId: '5',
      created: true,
    });
    await JOIN(req(), ctx({ code: 'x'.repeat(32) }));
    expect(mocks.sendPushToUsers).toHaveBeenCalledTimes(1);
    mocks.requestToJoin.mockResolvedValueOnce({
      status: 'pending',
      fridgeId: '5',
      created: false,
    });
    await JOIN(req(), ctx({ code: 'x'.repeat(32) }));
    expect(mocks.sendPushToUsers).toHaveBeenCalledTimes(1);
  });
});

describe('나가기와 전환', () => {
  it('혼자 쓰는 냉장고에서는 나갈 수 없다 (409)', async () => {
    mocks.leaveFridge.mockResolvedValue({ status: 'alone' });
    expect((await LEAVE(req(), ctx({ id: '5' }))).status).toBe(409);
  });

  it('구성원이 아닌 냉장고로는 바꿀 수 없다 (404)', async () => {
    mocks.switchCurrentFridge.mockResolvedValue(false);
    const res = await SWITCH(
      new Request('http://localhost/api', {
        method: 'PUT',
        body: JSON.stringify({ fridgeId: '6' }),
      }),
    );
    expect(res.status).toBe(404);
    expect(mocks.switchCurrentFridge).toHaveBeenCalledWith('7', '6');
  });
});
