// app/lib/fridges/sharing.ts
// 냉장고 함께 쓰기: 초대 링크, 참여 요청과 승인, 내보내기, 나가기, 냉장고 전환 (서버 전용)
// 링크가 새어도 기존 구성원이 승인하기 전에는 냉장고 이름과 구성원 수 외에 아무것도 보이지 않는다.

import { randomBytes } from 'node:crypto';
import type { PoolClient } from 'pg';
import { getPool } from '@/app/lib/db';
import {
  DEFAULT_FRIDGE_NAME,
  displayNameSql,
  ensureOwnFridge,
  fridgeNameForMemberSql,
  REQUEST_TTL_HOURS,
  type FridgeRole,
} from '@/app/lib/fridges/store';
import { INVITE_CODE_PATTERN } from '@/app/lib/schemas/fridge';

// 한 사람이 속할 수 있는 냉장고 수 (내 냉장고 포함)
export const MAX_FRIDGES_PER_USER = 5;
export const INVITE_TTL_HOURS = 24;

// 추측할 수 없도록 24바이트 무작위 값을 주소에 쓸 수 있는 문자로 바꾼다 (32자)
export function createInviteCode(): string {
  return randomBytes(24).toString('base64url');
}

async function inTransaction<T>(
  work: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ---------- 내 냉장고 목록과 전환 ----------

export interface MyFridgeJson {
  id: string;
  name: string;
  role: FridgeRole;
  memberCount: number;
}

export async function listMyFridges(userId: string): Promise<MyFridgeJson[]> {
  const { rows } = await getPool().query<{
    id: string;
    name: string;
    role: FridgeRole;
    member_count: number;
  }>(
    `SELECT f.id, ${fridgeNameForMemberSql('f', 'm.role')} AS name, m.role,
       (SELECT count(*)::int FROM fridge_members x WHERE x.fridge_id = f.id) AS member_count
     FROM fridge_members m JOIN fridges f ON f.id = m.fridge_id
     WHERE m.user_id = $1
     ORDER BY m.joined_at, f.id`,
    [Number(userId)],
  );
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    role: row.role,
    memberCount: row.member_count,
  }));
}

// 구성원인 냉장고로만 바꾼다. 아니면 false
export async function switchCurrentFridge(
  userId: string,
  fridgeId: string,
): Promise<boolean> {
  const { rowCount } = await getPool().query(
    `UPDATE users SET last_fridge_id = $2
     WHERE id = $1
       AND EXISTS (SELECT 1 FROM fridge_members WHERE fridge_id = $2 AND user_id = $1)`,
    [Number(userId), fridgeId],
  );
  return rowCount === 1;
}

export async function renameFridge(
  fridgeId: string,
  name: string,
): Promise<void> {
  await getPool().query(`UPDATE fridges SET name = $2 WHERE id = $1`, [
    fridgeId,
    name,
  ]);
}

// ---------- 초대 링크 ----------

export interface InviteJson {
  code: string;
  expiresAt: string;
}

const ACTIVE_INVITE = `revoked_at IS NULL AND expires_at > now()`;

export async function getActiveInvite(
  fridgeId: string,
): Promise<InviteJson | null> {
  const { rows } = await getPool().query<{ code: string; expires_at: Date }>(
    `SELECT code, expires_at FROM fridge_invites
     WHERE fridge_id = $1 AND ${ACTIVE_INVITE}
     ORDER BY created_at DESC LIMIT 1`,
    [fridgeId],
  );
  return rows[0]
    ? { code: rows[0].code, expiresAt: rows[0].expires_at.toISOString() }
    : null;
}

// 새 링크를 만들면 이전 링크는 바로 쓸 수 없다
export async function createInvite(
  userId: string,
  fridgeId: string,
): Promise<InviteJson> {
  return inTransaction(async client => {
    await client.query(
      `UPDATE fridge_invites SET revoked_at = now()
       WHERE fridge_id = $1 AND revoked_at IS NULL`,
      [fridgeId],
    );
    const { rows } = await client.query<{ code: string; expires_at: Date }>(
      `INSERT INTO fridge_invites (code, fridge_id, created_by, expires_at)
       VALUES ($1, $2, $3, now() + make_interval(hours => $4))
       RETURNING code, expires_at`,
      [createInviteCode(), fridgeId, Number(userId), INVITE_TTL_HOURS],
    );
    return {
      code: rows[0].code,
      expiresAt: rows[0].expires_at.toISOString(),
    };
  });
}

export async function revokeInvites(fridgeId: string): Promise<void> {
  await getPool().query(
    `UPDATE fridge_invites SET revoked_at = now()
     WHERE fridge_id = $1 AND revoked_at IS NULL`,
    [fridgeId],
  );
}

export interface InvitePreview {
  fridgeId: string;
  // 이름을 바꾸지 않은 냉장고면 null (참여 화면이 "가족 냉장고"로 부른다)
  fridgeName: string | null;
  memberCount: number;
}

// 참여 화면에 보여 줄 정보. 쓸 수 없는 링크면 null
export async function getInvitePreview(
  code: string,
): Promise<InvitePreview | null> {
  if (!INVITE_CODE_PATTERN.test(code)) return null;
  const { rows } = await getPool().query<{
    fridge_id: string;
    name: string;
    member_count: number;
  }>(
    `SELECT i.fridge_id, f.name,
       (SELECT count(*)::int FROM fridge_members m WHERE m.fridge_id = i.fridge_id) AS member_count
     FROM fridge_invites i JOIN fridges f ON f.id = i.fridge_id
     WHERE i.code = $1 AND i.revoked_at IS NULL AND i.expires_at > now()`,
    [code],
  );
  const row = rows[0];
  return row
    ? {
        fridgeId: row.fridge_id,
        fridgeName: row.name === DEFAULT_FRIDGE_NAME ? null : row.name,
        memberCount: row.member_count,
      }
    : null;
}

// ---------- 참여 요청과 승인 ----------

export type JoinResult =
  | { status: 'invalid' }
  | { status: 'limit' }
  | { status: 'member'; fridgeId: string }
  | { status: 'pending'; fridgeId: string; created: boolean };

async function countMemberships(client: PoolClient, userId: string) {
  const { rows } = await client.query<{ n: number }>(
    `SELECT count(*)::int AS n FROM fridge_members WHERE user_id = $1`,
    [Number(userId)],
  );
  return rows[0].n;
}

export async function requestToJoin(
  userId: string,
  code: string,
): Promise<JoinResult> {
  if (!INVITE_CODE_PATTERN.test(code)) return { status: 'invalid' };
  return inTransaction(async client => {
    const invite = await client.query<{ fridge_id: string }>(
      `SELECT fridge_id FROM fridge_invites
       WHERE code = $1 AND ${ACTIVE_INVITE}`,
      [code],
    );
    const fridgeId = invite.rows[0]?.fridge_id;
    if (!fridgeId) return { status: 'invalid' };

    // 이미 구성원이면 요청을 만들지 않고 그대로 성공으로 본다
    const member = await client.query(
      `SELECT 1 FROM fridge_members WHERE fridge_id = $1 AND user_id = $2`,
      [fridgeId, Number(userId)],
    );
    if (member.rowCount) return { status: 'member', fridgeId };

    if ((await countMemberships(client, userId)) >= MAX_FRIDGES_PER_USER) {
      return { status: 'limit' };
    }

    // 하루가 지난 대기 요청은 만료로 돌리고 새로 받는다
    await client.query(
      `UPDATE fridge_join_requests SET status = 'expired'
       WHERE fridge_id = $1 AND user_id = $2 AND status = 'pending'
         AND created_at <= now() - make_interval(hours => $3)`,
      [fridgeId, Number(userId), REQUEST_TTL_HOURS],
    );
    const inserted = await client.query(
      `INSERT INTO fridge_join_requests (fridge_id, user_id, invite_code)
       VALUES ($1, $2, $3)
       ON CONFLICT (fridge_id, user_id) WHERE status = 'pending' DO NOTHING`,
      [fridgeId, Number(userId), code],
    );
    return { status: 'pending', fridgeId, created: inserted.rowCount === 1 };
  });
}

export interface JoinRequestJson {
  id: string;
  userId: string;
  name: string | null;
  image: string | null;
  createdAt: string;
}

export async function listPendingRequests(
  fridgeId: string,
): Promise<JoinRequestJson[]> {
  const { rows } = await getPool().query<{
    id: string;
    user_id: number;
    name: string | null;
    image: string | null;
    created_at: Date;
  }>(
    `SELECT r.id, r.user_id, ${displayNameSql('u')} AS name, u.image, r.created_at
     FROM fridge_join_requests r JOIN users u ON u.id = r.user_id
     WHERE r.fridge_id = $1 AND r.status = 'pending'
       AND r.created_at > now() - make_interval(hours => $2)
     ORDER BY r.created_at`,
    [fridgeId, REQUEST_TTL_HOURS],
  );
  return rows.map(row => ({
    id: row.id,
    userId: String(row.user_id),
    name: row.name,
    image: row.image,
    createdAt: row.created_at.toISOString(),
  }));
}

export type DecideResult =
  | { status: 'not_found' }
  | { status: 'limit' }
  | { status: 'approved' | 'rejected'; requesterId: string };

// 대기 중이고 만료되지 않은 요청만 처리한다. 두 사람이 동시에 눌러도 한 번만 처리된다
export async function decideRequest(
  deciderId: string,
  fridgeId: string,
  requestId: string,
  approve: boolean,
): Promise<DecideResult> {
  return inTransaction(async client => {
    const { rows } = await client.query<{ user_id: number }>(
      `SELECT user_id FROM fridge_join_requests
       WHERE id = $1 AND fridge_id = $2 AND status = 'pending'
         AND created_at > now() - make_interval(hours => $3)
       FOR UPDATE`,
      [requestId, fridgeId, REQUEST_TTL_HOURS],
    );
    const requester = rows[0] ? String(rows[0].user_id) : null;
    if (!requester) return { status: 'not_found' };

    if (approve) {
      if ((await countMemberships(client, requester)) >= MAX_FRIDGES_PER_USER) {
        return { status: 'limit' };
      }
      await client.query(
        `INSERT INTO fridge_members (fridge_id, user_id, role)
         VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING`,
        [fridgeId, Number(requester)],
      );
      // 초대받아 들어온 냉장고이니 요청한 사람이 다음에 앱을 열면 이 냉장고부터 보이게 한다
      // (지금 보고 있는 화면은 바꾸지 않는다: resolveCurrentFridge의 keepFridgeId)
      await client.query(`UPDATE users SET last_fridge_id = $1 WHERE id = $2`, [
        fridgeId,
        Number(requester),
      ]);
    }
    await client.query(
      `UPDATE fridge_join_requests
       SET status = $2, decided_by = $3, decided_at = now()
       WHERE id = $1`,
      [requestId, approve ? 'approved' : 'rejected', Number(deciderId)],
    );
    return {
      status: approve ? 'approved' : 'rejected',
      requesterId: requester,
    };
  });
}

// 참여 화면에서 승인을 기다리는 동안 내 상태를 확인한다
export type MyJoinStatus = 'member' | 'pending' | 'none';

export async function getMyJoinStatus(
  userId: string,
  code: string,
): Promise<{ status: MyJoinStatus; fridgeId: string } | null> {
  if (!INVITE_CODE_PATTERN.test(code)) return null;
  // 승인된 뒤에는 링크가 만료되거나 꺼져도 결과를 알 수 있도록 링크의 유효 여부는 보지 않는다
  const { rows } = await getPool().query<{
    fridge_id: string;
    is_member: boolean;
    is_pending: boolean;
  }>(
    `SELECT i.fridge_id,
       EXISTS (SELECT 1 FROM fridge_members m
               WHERE m.fridge_id = i.fridge_id AND m.user_id = $2) AS is_member,
       EXISTS (SELECT 1 FROM fridge_join_requests r
               WHERE r.fridge_id = i.fridge_id AND r.user_id = $2 AND r.status = 'pending'
                 AND r.created_at > now() - make_interval(hours => $3)) AS is_pending
     FROM fridge_invites i WHERE i.code = $1`,
    [code, Number(userId), REQUEST_TTL_HOURS],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    fridgeId: row.fridge_id,
    status: row.is_member ? 'member' : row.is_pending ? 'pending' : 'none',
  };
}

// ---------- 내보내기와 나가기 ----------

export type RemoveResult = 'removed' | 'not_found' | 'owner';

// 만든 사람(owner)만 호출한다 (라우트에서 확인). 만든 사람 자신은 내보낼 수 없다
export async function removeMember(
  fridgeId: string,
  targetUserId: string,
): Promise<RemoveResult> {
  return inTransaction(async client => {
    const { rows } = await client.query<{ role: FridgeRole }>(
      `DELETE FROM fridge_members
       WHERE fridge_id = $1 AND user_id = $2 AND role = 'member'
       RETURNING role`,
      [fridgeId, Number(targetUserId)],
    );
    if (!rows[0]) {
      const owner = await client.query(
        `SELECT 1 FROM fridge_members WHERE fridge_id = $1 AND user_id = $2`,
        [fridgeId, Number(targetUserId)],
      );
      return owner.rowCount ? 'owner' : 'not_found';
    }
    // 내보낸 사람이 다른 냉장고가 없으면 빈 내 냉장고를 만들어 둔다
    await ensureOwnFridge(targetUserId, client);
    return 'removed';
  });
}

export type LeaveResult =
  | { status: 'left'; currentFridgeId: string }
  | { status: 'not_member' }
  | { status: 'alone' };

// 내가 넣은 품목과 댓글은 냉장고에 남는다. 만든 사람이 나가면 가장 먼저 들어온 구성원이 이어받는다
// 혼자 쓰는 냉장고에서는 나갈 수 없다 (나가면 품목을 볼 사람이 없어진다)
export async function leaveFridge(
  userId: string,
  fridgeId: string,
): Promise<LeaveResult> {
  return inTransaction(async client => {
    // 두 사람이 동시에 나가 아무도 남지 않는 경우를 막도록 냉장고 행을 잠근다
    await client.query(`SELECT id FROM fridges WHERE id = $1 FOR UPDATE`, [
      fridgeId,
    ]);
    const members = await client.query<{ user_id: number; role: FridgeRole }>(
      `SELECT user_id, role FROM fridge_members
       WHERE fridge_id = $1 ORDER BY joined_at, user_id`,
      [fridgeId],
    );
    const me = members.rows.find(row => String(row.user_id) === userId);
    if (!me) return { status: 'not_member' };
    if (members.rows.length === 1) return { status: 'alone' };

    await client.query(
      `DELETE FROM fridge_members WHERE fridge_id = $1 AND user_id = $2`,
      [fridgeId, Number(userId)],
    );
    if (me.role === 'owner') {
      const next = members.rows.find(row => String(row.user_id) !== userId);
      await client.query(
        `UPDATE fridge_members SET role = 'owner'
         WHERE fridge_id = $1 AND user_id = $2`,
        [fridgeId, next!.user_id],
      );
    }
    const currentFridgeId = await ensureOwnFridge(userId, client);
    await client.query(`UPDATE users SET last_fridge_id = $2 WHERE id = $1`, [
      Number(userId),
      currentFridgeId,
    ]);
    return { status: 'left', currentFridgeId };
  });
}

// 알림 대상: 이 냉장고의 다른 구성원
export async function listOtherMemberIds(
  fridgeId: string,
  exceptUserId: string,
): Promise<string[]> {
  const { rows } = await getPool().query<{ user_id: number }>(
    `SELECT user_id FROM fridge_members WHERE fridge_id = $1 AND user_id <> $2`,
    [fridgeId, Number(exceptUserId)],
  );
  return rows.map(row => String(row.user_id));
}

// 알림 문구용 이름. 이름을 바꾸지 않은 냉장고는 받는 사람마다 다르게 읽히지 않도록 "OO님의 냉장고"로 부른다
export async function getNamesForNotice(
  fridgeId: string,
  userId: string,
): Promise<{ fridgeName: string; userName: string }> {
  const { rows } = await getPool().query<{
    fridge_name: string;
    user_name: string | null;
  }>(
    `SELECT ${fridgeNameForMemberSql('f', "'member'")} AS fridge_name,
       (SELECT ${displayNameSql('u')} FROM users u WHERE u.id = $2) AS user_name
     FROM fridges f WHERE f.id = $1`,
    [fridgeId, Number(userId)],
  );
  return {
    fridgeName: rows[0]?.fridge_name ?? '가족 냉장고',
    userName: rows[0]?.user_name ?? '가족',
  };
}
