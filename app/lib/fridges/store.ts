// app/lib/fridges/store.ts
// 냉장고와 구성원 조회 (서버 전용)
// 품목 권한은 모두 "로그인 사용자가 이 냉장고의 구성원인가"로 판단한다. 주소나 본문의 냉장고 번호만 믿지 않는다.

import type { PoolClient } from 'pg';
import { getPool } from '@/app/lib/db';

export type FridgeRole = 'owner' | 'member';

export interface FridgeMemberJson {
  userId: string;
  name: string | null;
  image: string | null;
  role: FridgeRole;
}

export interface CurrentFridgeJson {
  id: string;
  name: string;
  role: FridgeRole;
  // 구성원 목록에서 나를 찾기 위한 내 사용자 번호
  myUserId: string;
  members: FridgeMemberJson[];
  // 승인을 기다리는 참여 요청 수 (구성원에게 표시)
  pendingRequestCount: number;
}

// 승인을 기다리는 요청도 하루가 지나면 만료
export const REQUEST_TTL_HOURS = 24;

export async function countPendingRequests(fridgeId: string): Promise<number> {
  const { rows } = await getPool().query<{ n: number }>(
    `SELECT count(*)::int AS n FROM fridge_join_requests
     WHERE fridge_id = $1 AND status = 'pending'
       AND created_at > now() - make_interval(hours => $2)`,
    [fridgeId, REQUEST_TTL_HOURS],
  );
  return rows[0].n;
}

// 화면 표시 이름 규칙(app/lib/user/displayName.ts)과 같은 순서: 가족 내 호칭 > 구글 이름 > 이메일 앞부분
export const displayNameSql = (alias: string) =>
  `COALESCE(NULLIF(btrim(${alias}.family_nickname), ''),
            NULLIF(btrim(${alias}.name), ''),
            NULLIF(split_part(${alias}.email, '@', 1), ''))`;

type Db = Pick<PoolClient, 'query'>;

export const DEFAULT_FRIDGE_NAME = '내 냉장고';

// 이름을 바꾸지 않은 냉장고는 만든 사람에게만 "내 냉장고"다.
// 함께 보는 사람에게는 "OO님의 냉장고"로 보여 여러 냉장고를 구분할 수 있게 한다
export const fridgeNameForMemberSql = (fridge: string, roleExpr: string) =>
  `CASE WHEN ${fridge}.name = '${DEFAULT_FRIDGE_NAME}' AND ${roleExpr} = 'member'
     THEN COALESCE(
       (SELECT ${displayNameSql('o')} || '님의 냉장고'
        FROM fridge_members om JOIN users o ON o.id = om.user_id
        WHERE om.fridge_id = ${fridge}.id AND om.role = 'owner'),
       ${fridge}.name)
     ELSE ${fridge}.name END`;

// 구성원이 아니면 null. 존재하지 않는 냉장고와 구별하지 않는다
export async function getFridgeRole(
  userId: string,
  fridgeId: string,
  db: Db = getPool(),
): Promise<FridgeRole | null> {
  const { rows } = await db.query<{ role: FridgeRole }>(
    `SELECT role FROM fridge_members WHERE fridge_id = $1 AND user_id = $2`,
    [fridgeId, Number(userId)],
  );
  return rows[0]?.role ?? null;
}

// 가입할 때와 마지막 냉장고에서 나갈 때 쓴다. 호출하는 쪽 트랜잭션 안에서 실행한다
export async function createOwnFridge(userId: string, db: Db): Promise<string> {
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO fridges (created_by) VALUES ($1) RETURNING id`,
    [Number(userId)],
  );
  const fridgeId = rows[0].id;
  await db.query(
    `INSERT INTO fridge_members (fridge_id, user_id, role) VALUES ($1, $2, 'owner')`,
    [fridgeId, Number(userId)],
  );
  await db.query(`UPDATE users SET last_fridge_id = $1 WHERE id = $2`, [
    fridgeId,
    Number(userId),
  ]);
  return fridgeId;
}

// 속한 냉장고가 없을 때만 내 냉장고를 만든다. 호출하는 쪽 트랜잭션 안에서 실행한다
export async function ensureOwnFridge(userId: string, db: Db): Promise<string> {
  // 같은 사용자의 동시 요청이 냉장고를 두 개 만들지 않도록 사용자 행을 잠근다
  await db.query(`SELECT id FROM users WHERE id = $1 FOR UPDATE`, [
    Number(userId),
  ]);
  const { rows } = await db.query<{ fridge_id: string }>(
    `SELECT fridge_id FROM fridge_members WHERE user_id = $1 ORDER BY joined_at LIMIT 1`,
    [Number(userId)],
  );
  return rows[0]?.fridge_id ?? createOwnFridge(userId, db);
}

interface FridgeSummary {
  id: string;
  name: string;
  role: FridgeRole;
}

// 마지막으로 본 냉장고. 그 냉장고에서 빠졌으면 가장 먼저 들어간 냉장고, 하나도 없으면 새로 만든다
// keepFridgeId: 지금 화면에 보이는 냉장고. 아직 구성원이면 그대로 둬서, 다시 확인하는 사이에
// 승인 등으로 마지막 냉장고가 바뀌어도 보고 있던 화면이 갑자기 바뀌지 않게 한다
export async function resolveCurrentFridge(
  userId: string,
  keepFridgeId?: string,
): Promise<FridgeSummary> {
  const query = () =>
    getPool().query<FridgeSummary>(
      `SELECT f.id, ${fridgeNameForMemberSql('f', 'm.role')} AS name, m.role
       FROM fridge_members m
       JOIN fridges f ON f.id = m.fridge_id
       JOIN users u ON u.id = m.user_id
       WHERE m.user_id = $1
       ORDER BY (m.fridge_id = $2::bigint) DESC NULLS LAST,
         (m.fridge_id = u.last_fridge_id) DESC, m.joined_at, m.fridge_id
       LIMIT 1`,
      [Number(userId), keepFridgeId ?? null],
    );
  const { rows } = await query();
  if (rows[0]) return rows[0];

  // 마이그레이션 이후 가입 처리 전에 생긴 계정처럼 냉장고가 없는 경우를 대비한다
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await ensureOwnFridge(userId, client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  const created = await query();
  return created.rows[0];
}

export async function listFridgeMembers(
  fridgeId: string,
): Promise<FridgeMemberJson[]> {
  const { rows } = await getPool().query<{
    user_id: number;
    name: string | null;
    image: string | null;
    role: FridgeRole;
  }>(
    `SELECT m.user_id, ${displayNameSql('u')} AS name, u.image, m.role
     FROM fridge_members m JOIN users u ON u.id = m.user_id
     WHERE m.fridge_id = $1
     ORDER BY (m.role = 'owner') DESC, m.joined_at, m.user_id`,
    [fridgeId],
  );
  return rows.map(row => ({
    userId: String(row.user_id),
    name: row.name,
    image: row.image,
    role: row.role,
  }));
}

export async function getCurrentFridge(
  userId: string,
  keepFridgeId?: string,
): Promise<CurrentFridgeJson> {
  const fridge = await resolveCurrentFridge(userId, keepFridgeId);
  const [members, pendingRequestCount] = await Promise.all([
    listFridgeMembers(fridge.id),
    countPendingRequests(fridge.id),
  ]);
  return { ...fridge, myUserId: userId, members, pendingRequestCount };
}
