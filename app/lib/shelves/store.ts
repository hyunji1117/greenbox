// app/lib/shelves/store.ts
// 선반 보기 베타의 저장 (서버 전용). 구성원 확인은 호출하는 쪽(requireFridgeMember)이 먼저 한다
// 품목이 사라지지 않게: 선반은 비어 있을 때만 줄이고, 한 선반에 MAX_ITEMS_PER_SHELF개를 넘겨 넣지 않는다

import { getPool } from '@/app/lib/db';
import type { Category } from '@/app/lib/schemas/item';
import type { ShelfSettings } from '@/app/lib/schemas/shelves';
import {
  DEFAULT_SHELF_COUNT,
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

export async function getShelfSettings(
  fridgeId: string,
  userId: string,
): Promise<ShelfSettings> {
  const { rows } = await getPool().query<{
    enabled: boolean;
    can_toggle: boolean;
  }>(
    `SELECT
       COALESCE((SELECT f.enabled FROM fridge_features f
                 WHERE f.fridge_id = $1 AND f.feature = $3), false) AS enabled,
       EXISTS (
         SELECT 1 FROM fridge_members m
         JOIN experiment_members e ON e.user_id = m.user_id AND e.experiment = $3
         WHERE m.fridge_id = $1 AND m.user_id = $2 AND m.role = 'owner'
       ) AS can_toggle`,
    [fridgeId, Number(userId), SHELF_VIEW_EXPERIMENT],
  );
  return {
    enabled: rows[0]?.enabled ?? false,
    canToggle: rows[0]?.can_toggle ?? false,
    counts: await readCounts(fridgeId),
  };
}

// 냉장고 주인이면서 허용 목록에 있을 때만 켜고 끈다. 아니면 false
export async function setShelfView(
  fridgeId: string,
  userId: string,
  enabled: boolean,
): Promise<boolean> {
  const { canToggle } = await getShelfSettings(fridgeId, userId);
  if (!canToggle) return false;
  await getPool().query(
    `INSERT INTO fridge_features (fridge_id, feature, enabled, updated_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (fridge_id, feature)
     DO UPDATE SET enabled = EXCLUDED.enabled, updated_by = EXCLUDED.updated_by, updated_at = now()`,
    [fridgeId, SHELF_VIEW_EXPERIMENT, enabled, Number(userId)],
  );
  return true;
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
      [fridgeId, category, DEFAULT_SHELF_COUNT],
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
