// app/lib/shelves/store.ts
// 선반 보기 베타의 저장 (서버 전용). 구성원 확인은 호출하는 쪽(requireFridgeMember)이 먼저 한다
// 품목이 사라지지 않게: 선반은 비어 있을 때만 줄이고, 한 선반에 MAX_ITEMS_PER_SHELF개를 넘겨 넣지 않는다

import { getPool } from '@/app/lib/db';
import { displayNameSql } from '@/app/lib/fridges/store';
import type { Category } from '@/app/lib/schemas/item';
import type { ShelfSettings } from '@/app/lib/schemas/shelves';
import {
  DEFAULT_SHELF_COUNTS,
  MAX_ITEMS_PER_SHELF,
  MAX_SHELF_COUNT,
  SHELF_VIEW_EXPERIMENT,
  shelfToRemove,
  type ShelfCounts,
} from '@/app/lib/shelves/rules';

async function readCounts(fridgeId: string): Promise<ShelfCounts> {
  const { rows } = await getPool().query<{
    category: Category;
    shelf_count: number;
  }>('SELECT category, shelf_count FROM fridge_shelves WHERE fridge_id = $1', [
    fridgeId,
  ]);
  const counts = { ...DEFAULT_SHELF_COUNTS };
  for (const row of rows) counts[row.category] = row.shelf_count;
  return counts;
}

// 냉장고 가족이면 누구나 켜고 끈다. 단 전체 공개 전까지는 주인이 실험 허용 목록에 있는 냉장고만
// 마지막으로 바꾼 사람은 바꾼 기록(0016)에서 읽고, 기록 전에 바꾼 냉장고는 스위치에 남은 사람으로 대신한다
export async function getShelfSettings(
  fridgeId: string,
  userId: string,
): Promise<ShelfSettings> {
  const { rows } = await getPool().query<{
    enabled: boolean;
    can_toggle: boolean;
    my_role: 'owner' | 'member' | null;
    my_join_rank: number | null;
    last_name: string | null;
    last_enabled: boolean | null;
    last_at: Date | null;
  }>(
    `WITH ranked AS (
       SELECT m.user_id, m.role,
              row_number() OVER (ORDER BY (m.role = 'owner') DESC, m.joined_at, m.user_id)::int AS join_rank
       FROM fridge_members m WHERE m.fridge_id = $1
     ),
     feature AS (
       SELECT f.enabled, f.updated_by, f.updated_at FROM fridge_features f
       WHERE f.fridge_id = $1 AND f.feature = $3
     ),
     last_change AS (
       SELECT c.changed_by, c.enabled, c.created_at FROM fridge_feature_changes c
       WHERE c.fridge_id = $1 AND c.feature = $3
       ORDER BY c.created_at DESC, c.id DESC LIMIT 1
     )
     SELECT
       COALESCE((SELECT enabled FROM feature), false) AS enabled,
       EXISTS (SELECT 1 FROM ranked WHERE user_id = $2)
         AND EXISTS (
           SELECT 1 FROM ranked r
           JOIN experiment_members e ON e.user_id = r.user_id AND e.experiment = $3
           WHERE r.role = 'owner'
         ) AS can_toggle,
       (SELECT role FROM ranked WHERE user_id = $2) AS my_role,
       (SELECT join_rank FROM ranked WHERE user_id = $2) AS my_join_rank,
       COALESCE(
         (SELECT ${displayNameSql('u')} FROM last_change l JOIN users u ON u.id = l.changed_by),
         (SELECT ${displayNameSql('u')} FROM feature f JOIN users u ON u.id = f.updated_by)
       ) AS last_name,
       COALESCE((SELECT enabled FROM last_change), (SELECT enabled FROM feature)) AS last_enabled,
       COALESCE((SELECT created_at FROM last_change), (SELECT updated_at FROM feature)) AS last_at`,
    [fridgeId, Number(userId), SHELF_VIEW_EXPERIMENT],
  );
  const row = rows[0];
  return {
    enabled: row?.enabled ?? false,
    canToggle: row?.can_toggle ?? false,
    myRole: row?.my_role ?? 'member',
    myJoinRank: row?.my_join_rank ?? 1,
    lastChange:
      row?.last_at && row.last_enabled !== null
        ? { name: row.last_name, enabled: row.last_enabled, at: row.last_at }
        : null,
    counts: await readCounts(fridgeId),
  };
}

// 바꿀 수 있는 사람이면 스위치를 바꾸고, 바꾼 사람의 역할과 들어온 순서, 가족 수를 한 줄 남긴다. 아니면 false
export async function setShelfView(
  fridgeId: string,
  userId: string,
  enabled: boolean,
): Promise<boolean> {
  const { canToggle } = await getShelfSettings(fridgeId, userId);
  if (!canToggle) return false;
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO fridge_features (fridge_id, feature, enabled, updated_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (fridge_id, feature)
       DO UPDATE SET enabled = EXCLUDED.enabled, updated_by = EXCLUDED.updated_by, updated_at = now()`,
      [fridgeId, SHELF_VIEW_EXPERIMENT, enabled, Number(userId)],
    );
    await client.query(
      `WITH ranked AS (
         SELECT m.user_id, m.role,
                row_number() OVER (ORDER BY (m.role = 'owner') DESC, m.joined_at, m.user_id) AS join_rank,
                count(*) OVER () AS member_count
         FROM fridge_members m WHERE m.fridge_id = $1
       )
       INSERT INTO fridge_feature_changes
         (fridge_id, feature, enabled, changed_by, member_role, join_rank, member_count)
       SELECT $1, $2, $3, r.user_id, r.role, r.join_rank, r.member_count
       FROM ranked r WHERE r.user_id = $4`,
      [fridgeId, SHELF_VIEW_EXPERIMENT, enabled, Number(userId)],
    );
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export type ShelfCountResult =
  | { ok: true; counts: ShelfCounts }
  | { ok: false; reason: 'max' | 'not_empty' };

// 선반 하나 더하기, 아래쪽 빈 선반 하나 빼기. 같은 칸을 동시에 바꿔도 꼬이지 않게 행을 잠근다
export async function changeShelfCount(
  fridgeId: string,
  category: Category,
  action: 'add' | 'remove',
): Promise<ShelfCountResult> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO fridge_shelves (fridge_id, category, shelf_count)
       VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [fridgeId, category, DEFAULT_SHELF_COUNTS[category]],
    );
    const { rows } = await client.query<{ shelf_count: number }>(
      `SELECT shelf_count FROM fridge_shelves
       WHERE fridge_id = $1 AND category = $2 FOR UPDATE`,
      [fridgeId, category],
    );
    const count = rows[0].shelf_count;

    if (action === 'add') {
      if (count >= MAX_SHELF_COUNT) {
        await client.query('ROLLBACK');
        return { ok: false, reason: 'max' };
      }
      await client.query(
        `UPDATE fridge_shelves SET shelf_count = $3, updated_at = now()
         WHERE fridge_id = $1 AND category = $2`,
        [fridgeId, category, count + 1],
      );
    } else {
      const occupied = await client.query<{ shelf: number }>(
        `SELECT DISTINCT shelf FROM items
         WHERE fridge_id = $1 AND category = $2 AND NOT finished AND shelf IS NOT NULL`,
        [fridgeId, category],
      );
      const target = shelfToRemove(
        count,
        new Set(occupied.rows.map(row => row.shelf)),
      );
      if (target === null) {
        await client.query('ROLLBACK');
        return { ok: false, reason: 'not_empty' };
      }
      // 뺀 선반 아래 품목은 한 칸씩 올린다. 뺀 선반에 남은 다 먹은 품목은 선반 미정으로 둔다
      await client.query(
        `UPDATE items SET shelf = CASE WHEN shelf = $3 THEN NULL ELSE shelf - 1 END
         WHERE fridge_id = $1 AND category = $2 AND shelf >= $3`,
        [fridgeId, category, target],
      );
      await client.query(
        `UPDATE fridge_shelves SET shelf_count = $3, updated_at = now()
         WHERE fridge_id = $1 AND category = $2`,
        [fridgeId, category, count - 1],
      );
    }
    await client.query('COMMIT');
    return { ok: true, counts: await readCounts(fridgeId) };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

// 품목을 그 선반에 놓을 수 있는지. excludeItemId: 옮기는 품목 자신은 세지 않는다
export async function shelfSlotState(
  fridgeId: string,
  category: Category,
  shelf: number,
  excludeItemId?: string,
): Promise<'ok' | 'full' | 'no_shelf'> {
  const counts = await readCounts(fridgeId);
  if (shelf > counts[category]) return 'no_shelf';
  const { rows } = await getPool().query<{ n: number }>(
    `SELECT count(*)::int AS n FROM items
     WHERE fridge_id = $1 AND category = $2 AND shelf = $3 AND NOT finished
       AND ($4::bigint IS NULL OR id <> $4::bigint)`,
    [fridgeId, category, shelf, excludeItemId ?? null],
  );
  return rows[0].n >= MAX_ITEMS_PER_SHELF ? 'full' : 'ok';
}

// 옮기려는 품목의 냉장고와 칸. 내가 구성원인 냉장고의 품목이 아니면 null
export async function findItemPlacement(
  userId: string,
  itemId: string,
): Promise<{ fridgeId: string; category: Category } | null> {
  const { rows } = await getPool().query<{
    fridge_id: string;
    category: Category;
  }>(
    `SELECT i.fridge_id::text AS fridge_id, i.category FROM items i
     WHERE i.id = $2 AND EXISTS (
       SELECT 1 FROM fridge_members m WHERE m.fridge_id = i.fridge_id AND m.user_id = $1
     )`,
    [Number(userId), itemId],
  );
  return rows[0]
    ? { fridgeId: rows[0].fridge_id, category: rows[0].category }
    : null;
}
