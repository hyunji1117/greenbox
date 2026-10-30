// app/lib/items/store.ts
// 냉장고 품목 조회와 저장 (서버 전용)
// 모든 쿼리를 user_id로 제한해서 다른 사용자의 품목은 읽거나 고칠 수 없다.

import { getPool } from '@/app/lib/db';
import type { CreateItemInput, UpdateItemInput } from '@/app/lib/schemas/item';

interface CommentJson {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface ItemRow {
  id: string;
  name: string;
  category: string;
  quantity: number;
  added_by: string;
  created_at: Date;
  finished: boolean;
  expiry_date: string | null;
  comments: CommentJson[];
}

// 유통기한은 시간대 변환이 끼지 않도록 문자열로 읽는다
const SELECT_ITEMS = `
  SELECT i.id, i.name, i.category, i.quantity, i.added_by, i.created_at, i.finished,
    to_char(i.expiry_date, 'YYYY-MM-DD') AS expiry_date,
    COALESCE(
      (SELECT json_agg(
          json_build_object(
            'id', c.id::text, 'text', c.text,
            'author', c.author, 'createdAt', c.created_at
          ) ORDER BY c.created_at
        )
        FROM item_comments c WHERE c.item_id = i.id),
      '[]'
    ) AS comments
  FROM items i`;

// DB 행을 응답 JSON으로 바꾼다. 결과는 ItemSchema(클라이언트 검증)를 통과해야 한다.
export function toItemJson(row: ItemRow) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    quantity: row.quantity,
    addedBy: row.added_by,
    addedAt: row.created_at.toISOString(),
    // json_build_object의 시간은 +00:00 형식이라 toISOString으로 맞춘다
    comments: row.comments.map(comment => ({
      ...comment,
      createdAt: new Date(comment.createdAt).toISOString(),
    })),
    finished: row.finished,
    expiryDate: row.expiry_date,
  };
}

export type ItemJson = ReturnType<typeof toItemJson>;

export async function listItems(userId: string): Promise<ItemJson[]> {
  const { rows } = await getPool().query<ItemRow>(
    `${SELECT_ITEMS} WHERE i.user_id = $1 ORDER BY i.created_at DESC, i.id DESC`,
    [Number(userId)],
  );
  return rows.map(toItemJson);
}

async function findItem(
  userId: string,
  itemId: string,
): Promise<ItemJson | null> {
  const { rows } = await getPool().query<ItemRow>(
    `${SELECT_ITEMS} WHERE i.user_id = $1 AND i.id = $2`,
    [Number(userId), itemId],
  );
  return rows[0] ? toItemJson(rows[0]) : null;
}

export async function createItem(
  userId: string,
  input: CreateItemInput,
): Promise<ItemJson> {
  const { rows } = await getPool().query<ItemRow>(
    `INSERT INTO items (user_id, name, category, quantity, added_by, expiry_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, category, quantity, added_by, created_at, finished,
       to_char(expiry_date, 'YYYY-MM-DD') AS expiry_date, '[]'::json AS comments`,
    [
      Number(userId),
      input.name,
      input.category,
      input.quantity,
      input.addedBy,
      input.expiryDate ?? null,
    ],
  );
  return toItemJson(rows[0]);
}

// 보내지 않은 항목은 그대로 둔다. 내 품목이 아니면 null
export async function updateItem(
  userId: string,
  itemId: string,
  input: UpdateItemInput,
): Promise<ItemJson | null> {
  const { rowCount } = await getPool().query(
    `UPDATE items SET
       name = COALESCE($3, name),
       category = COALESCE($4, category),
       quantity = COALESCE($5::integer, quantity),
       expiry_date = COALESCE($6::date, expiry_date),
       finished = COALESCE($7::boolean, finished),
       updated_at = now()
     WHERE user_id = $1 AND id = $2`,
    [
      Number(userId),
      itemId,
      input.name ?? null,
      input.category ?? null,
      input.quantity ?? null,
      input.expiryDate ?? null,
      input.finished ?? null,
    ],
  );
  return rowCount ? findItem(userId, itemId) : null;
}
