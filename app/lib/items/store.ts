// app/lib/items/store.ts
// 냉장고 품목 조회와 저장 (서버 전용)
// 모든 쿼리를 "로그인 사용자가 구성원인 냉장고"로 제한해서 다른 냉장고의 품목은 읽거나 고칠 수 없다.
// 누가 넣고 누가 댓글을 달았는지는 요청 본문이 아니라 로그인 사용자로 기록한다.

import { getPool } from '@/app/lib/db';
import { displayNameSql } from '@/app/lib/fridges/store';
import type {
  CreateCommentInput,
  CreateItemInput,
  UpdateItemInput,
} from '@/app/lib/schemas/item';

// 작성자. 탈퇴하면 id와 이름이 비고, 냉장고에서 나갔으면 isMember가 false
interface PersonJson {
  id: string | null;
  name: string | null;
  isMember: boolean;
}

interface CommentJson {
  id: string;
  text: string;
  author: PersonJson;
  createdAt: string;
}

export interface ItemRow {
  id: string;
  name: string;
  category: string;
  quantity: number;
  created_at: Date;
  finished: boolean;
  expiry_date: string | null;
  added_by: PersonJson;
  comments: CommentJson[];
}

// 작성자 이름과 지금도 이 냉장고 구성원인지 함께 만든다
const personSql = (userIdColumn: string, fridgeIdColumn: string) => `
  json_build_object(
    'id', ${userIdColumn}::text,
    'name', (SELECT ${displayNameSql('p')} FROM users p WHERE p.id = ${userIdColumn}),
    'isMember', EXISTS (
      SELECT 1 FROM fridge_members fm
      WHERE fm.fridge_id = ${fridgeIdColumn} AND fm.user_id = ${userIdColumn}
    )
  )`;

// 유통기한은 시간대 변환이 끼지 않도록 문자열로 읽는다
const SELECT_ITEMS = `
  SELECT i.id, i.name, i.category, i.quantity, i.created_at, i.finished,
    to_char(i.expiry_date, 'YYYY-MM-DD') AS expiry_date,
    ${personSql('i.created_by', 'i.fridge_id')} AS added_by,
    COALESCE(
      (SELECT json_agg(
          json_build_object(
            'id', c.id::text, 'text', c.text,
            'author', ${personSql('c.author_id', 'i.fridge_id')},
            'createdAt', c.created_at
          ) ORDER BY c.created_at, c.id
        )
        FROM item_comments c WHERE c.item_id = i.id),
      '[]'
    ) AS comments
  FROM items i`;

// 로그인 사용자가 구성원인 냉장고의 품목만 남기는 조건. $1은 사용자 id
const MEMBER_OF_ITEM_FRIDGE = `EXISTS (
  SELECT 1 FROM fridge_members m WHERE m.fridge_id = i.fridge_id AND m.user_id = $1
)`;

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

// 구성원 확인은 호출하는 쪽(requireFridgeMember)이 먼저 한다
export async function listItems(fridgeId: string): Promise<ItemJson[]> {
  const { rows } = await getPool().query<ItemRow>(
    `${SELECT_ITEMS} WHERE i.fridge_id = $1 ORDER BY i.created_at DESC, i.id DESC`,
    [fridgeId],
  );
  return rows.map(toItemJson);
}

async function findItem(itemId: string): Promise<ItemJson | null> {
  const { rows } = await getPool().query<ItemRow>(
    `${SELECT_ITEMS} WHERE i.id = $1`,
    [itemId],
  );
  return rows[0] ? toItemJson(rows[0]) : null;
}

// 구성원 확인은 호출하는 쪽(requireFridgeMember)이 먼저 한다
// user_id는 이전 코드로 되돌렸을 때 넣은 사람 기준으로 보이도록 함께 채운다
export async function createItem(
  fridgeId: string,
  userId: string,
  input: CreateItemInput,
): Promise<ItemJson> {
  const { rows } = await getPool().query<{ id: string }>(
    `INSERT INTO items (fridge_id, user_id, created_by, name, category, quantity, expiry_date)
     VALUES ($1, $2, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      fridgeId,
      Number(userId),
      input.name,
      input.category,
      input.quantity,
      input.expiryDate ?? null,
    ],
  );
  const item = await findItem(rows[0].id);
  if (!item) throw new Error('방금 추가한 품목을 찾을 수 없습니다');
  return item;
}

// 보내지 않은 항목은 그대로 둔다. 내가 구성원인 냉장고의 품목이 아니면 null
export async function updateItem(
  userId: string,
  itemId: string,
  input: UpdateItemInput,
): Promise<ItemJson | null> {
  const { rowCount } = await getPool().query(
    `UPDATE items i SET
       name = COALESCE($3, name),
       category = COALESCE($4, category),
       quantity = COALESCE($5::integer, quantity),
       expiry_date = COALESCE($6::date, expiry_date),
       finished = COALESCE($7::boolean, finished),
       updated_at = now()
     WHERE i.id = $2 AND ${MEMBER_OF_ITEM_FRIDGE}`,
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
  return rowCount ? findItem(itemId) : null;
}

// 내가 구성원인 냉장고의 품목일 때만 댓글을 남긴다. 아니면 null
export async function addComment(
  userId: string,
  itemId: string,
  input: CreateCommentInput,
): Promise<CommentJson | null> {
  const { rows } = await getPool().query<{
    id: string;
    text: string;
    created_at: Date;
    author: PersonJson;
  }>(
    `WITH inserted AS (
       INSERT INTO item_comments (item_id, author_id, text)
       SELECT i.id, $1, $3 FROM items i WHERE i.id = $2 AND ${MEMBER_OF_ITEM_FRIDGE}
       RETURNING id, item_id, author_id, text, created_at
     )
     SELECT c.id, c.text, c.created_at, ${personSql('c.author_id', 'i.fridge_id')} AS author
     FROM inserted c JOIN items i ON i.id = c.item_id`,
    [Number(userId), itemId, input.text],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    text: row.text,
    author: row.author,
    createdAt: row.created_at.toISOString(),
  };
}
