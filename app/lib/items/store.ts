// app/lib/items/store.ts
// 냉장고 품목 조회와 저장 (서버 전용)
// 모든 쿼리를 "로그인 사용자가 구성원인 냉장고"로 제한해서 다른 냉장고의 품목은 읽거나 고칠 수 없다.
// 누가 넣고 누가 댓글을 달았는지는 요청 본문이 아니라 로그인 사용자로 기록한다.

import { getPool } from '@/app/lib/db';
import { displayNameSql } from '@/app/lib/fridges/store';
import type {
  CreateCommentInput,
  CreateItemInput,
  UpdateCommentInput,
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
  editedAt: string | null;
}

export interface ItemRow {
  id: string;
  name: string;
  category: string;
  quantity: number;
  eaten_quantity: number;
  created_at: Date;
  finished: boolean;
  expiry_date: string | null;
  watched: boolean;
  shelf: number | null;
  // 마지막으로 바뀐 때. 다 먹음/버림 품목을 최근 순으로 보여 줄 때 쓴다 (예전 테스트 행에는 없다)
  updated_at?: Date;
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
// viewerParam: 보는 사람(로그인 사용자) 번호가 들어 있는 쿼리 자리. 그 사람의 관심 품목인지 함께 읽는다
const selectItems = (viewerParam: string) => `
  SELECT i.id, i.name, i.category, i.quantity, i.eaten_quantity, i.created_at, i.updated_at, i.finished, i.shelf,
    to_char(i.expiry_date, 'YYYY-MM-DD') AS expiry_date,
    EXISTS (
      SELECT 1 FROM item_watchers w WHERE w.item_id = i.id AND w.user_id = ${viewerParam}
    ) AS watched,
    ${personSql('i.created_by', 'i.fridge_id')} AS added_by,
    COALESCE(
      (SELECT json_agg(
          json_build_object(
            'id', c.id::text, 'text', c.text,
            'author', ${personSql('c.author_id', 'i.fridge_id')},
            'createdAt', c.created_at, 'editedAt', c.edited_at
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
    eatenQuantity: row.eaten_quantity,
    addedBy: row.added_by,
    addedAt: row.created_at.toISOString(),
    // json_build_object의 시간은 +00:00 형식이라 toISOString으로 맞춘다
    comments: row.comments.map(comment => ({
      ...comment,
      createdAt: new Date(comment.createdAt).toISOString(),
      editedAt: comment.editedAt
        ? new Date(comment.editedAt).toISOString()
        : null,
    })),
    finished: row.finished,
    expiryDate: row.expiry_date,
    watched: row.watched,
    shelf: row.shelf ?? null,
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
  };
}

export type ItemJson = ReturnType<typeof toItemJson>;

// 구성원 확인은 호출하는 쪽(requireFridgeMember)이 먼저 한다
export async function listItems(
  fridgeId: string,
  viewerId: string,
): Promise<ItemJson[]> {
  const { rows } = await getPool().query<ItemRow>(
    `${selectItems('$2')} WHERE i.fridge_id = $1 ORDER BY i.created_at DESC, i.id DESC`,
    [fridgeId, Number(viewerId)],
  );
  return rows.map(toItemJson);
}

async function findItem(
  itemId: string,
  viewerId: string,
): Promise<ItemJson | null> {
  const { rows } = await getPool().query<ItemRow>(
    `${selectItems('$2')} WHERE i.id = $1`,
    [itemId, Number(viewerId)],
  );
  return rows[0] ? toItemJson(rows[0]) : null;
}

// 구성원 확인은 호출하는 쪽(requireFridgeMember)이 먼저 한다
// user_id는 이전 코드로 되돌렸을 때 넣은 사람 기준으로 보이도록 함께 채운다
// 넣은 사람의 관심 품목으로도 함께 등록한다 (알림 수준이 "관심 품목만"이어도 내가 넣은 것은 알림이 온다)
export async function createItem(
  fridgeId: string,
  userId: string,
  input: CreateItemInput,
): Promise<ItemJson> {
  const { rows } = await getPool().query<{ id: string }>(
    `INSERT INTO items (fridge_id, user_id, created_by, name, category, quantity, expiry_date, shelf)
     VALUES ($1, $2, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      fridgeId,
      Number(userId),
      input.name,
      input.category,
      input.quantity,
      input.expiryDate ?? null,
      input.shelf ?? null,
    ],
  );
  await getPool().query(
    `INSERT INTO item_watchers (item_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [rows[0].id, Number(userId)],
  );
  const item = await findItem(rows[0].id, userId);
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
       -- 먹은 개수는 처음 산 수량을 넘지 않는다 (수량을 줄이면 함께 맞춘다)
       eaten_quantity = LEAST(
         COALESCE($8::integer, eaten_quantity),
         COALESCE($5::integer, quantity)
       ),
       expiry_date = COALESCE($6::date, expiry_date),
       finished = COALESCE($7::boolean, finished),
       -- 선반은 보냈을 때만 바꾼다 (null을 보내면 선반 미정으로)
       shelf = CASE WHEN $9::boolean THEN $10::smallint ELSE shelf END,
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
      input.eatenQuantity ?? null,
      input.shelf !== undefined,
      input.shelf ?? null,
    ],
  );
  return rowCount ? findItem(itemId, userId) : null;
}

interface CommentRow {
  id: string;
  text: string;
  created_at: Date;
  edited_at: Date | null;
  author: PersonJson;
}

// 방금 넣거나 고친 댓글(CTE)을 작성자 정보와 함께 읽는다
const SELECT_COMMENT_FROM = (cte: string) => `
  SELECT c.id::text AS id, c.text, c.created_at, c.edited_at,
    ${personSql('c.author_id', 'i.fridge_id')} AS author
  FROM ${cte} c JOIN items i ON i.id = c.item_id`;

function toCommentJson(row: CommentRow): CommentJson {
  return {
    id: row.id,
    text: row.text,
    author: row.author,
    createdAt: row.created_at.toISOString(),
    editedAt: row.edited_at?.toISOString() ?? null,
  };
}

// 내가 구성원인 냉장고의 품목일 때만 댓글을 남긴다. 아니면 null
export async function addComment(
  userId: string,
  itemId: string,
  input: CreateCommentInput,
): Promise<CommentJson | null> {
  const { rows } = await getPool().query<CommentRow>(
    `WITH inserted AS (
       INSERT INTO item_comments (item_id, author_id, text)
       SELECT i.id, $1, $3 FROM items i WHERE i.id = $2 AND ${MEMBER_OF_ITEM_FRIDGE}
       RETURNING id, item_id, author_id, text, created_at, edited_at
     )
     ${SELECT_COMMENT_FROM('inserted')}`,
    [Number(userId), itemId, input.text],
  );
  return rows[0] ? toCommentJson(rows[0]) : null;
}

// 내가 쓴 댓글이고 지금도 그 냉장고 구성원일 때만 고친다. 아니면 null
// 냉장고에서 나간 뒤에는 남은 가족이 보는 기록이 바뀌지 않도록 고칠 수 없다
export async function updateComment(
  userId: string,
  itemId: string,
  commentId: string,
  input: UpdateCommentInput,
): Promise<CommentJson | null> {
  const { rows } = await getPool().query<CommentRow>(
    `WITH updated AS (
       UPDATE item_comments c SET text = $4, edited_at = now()
       FROM items i
       WHERE c.id = $3 AND c.item_id = $2 AND i.id = c.item_id
         AND c.author_id = $1 AND ${MEMBER_OF_ITEM_FRIDGE}
       RETURNING c.id, c.item_id, c.author_id, c.text, c.created_at, c.edited_at
     )
     ${SELECT_COMMENT_FROM('updated')}`,
    [Number(userId), itemId, commentId, input.text],
  );
  return rows[0] ? toCommentJson(rows[0]) : null;
}
