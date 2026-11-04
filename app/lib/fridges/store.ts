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
  members: FridgeMemberJson[];
}

// 화면 표시 이름 규칙(app/lib/user/displayName.ts)과 같은 순서: 가족 내 호칭 > 구글 이름 > 이메일 앞부분
export const displayNameSql = (alias: string) =>
  `COALESCE(NULLIF(btrim(${alias}.family_nickname), ''),
            NULLIF(btrim(${alias}.name), ''),
            NULLIF(split_part(${alias}.email, '@', 1), ''))`;

type Db = Pick<PoolClient, 'query'>;

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
export async function resolveCurrentFridge(
  userId: string,
): Promise<FridgeSummary> {
  const query = () =>
    getPool().query<FridgeSummary>(
      `SELECT f.id, f.name, m.role
       FROM fridge_members m
       JOIN fridges f ON f.id = m.fridge_id
       JOIN users u ON u.id = m.user_id
       WHERE m.user_id = $1
       ORDER BY (m.fridge_id = u.last_fridge_id) DESC, m.joined_at, m.fridge_id
       LIMIT 1`,
      [Number(userId)],
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
): Promise<CurrentFridgeJson> {
  const fridge = await resolveCurrentFridge(userId);
  return { ...fridge, members: await listFridgeMembers(fridge.id) };
}
