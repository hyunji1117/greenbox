// app/lib/notes/store.ts
// 가족 게시판 저장 (서버 전용). 구성원 확인은 호출하는 쪽(requireFridgeMember)이 먼저 한다
// - 가족 누구나 쓰고, 누구나 확인(줄 긋기)하고, 확인된 메모만 지운다 (확인 전 메모는 실수로 지우지 않게)
// - 선반 보기 베타가 켜진 냉장고에서만 쓴다 (닫힌 문 위에 붙는 기능이라서. 방침은 2026-11-15 버전에 반영)

import { getPool } from '@/app/lib/db';
import { displayNameSql } from '@/app/lib/fridges/store';
import type { Note } from '@/app/lib/schemas/notes';
import { SHELF_VIEW_EXPERIMENT } from '@/app/lib/shelves/rules';

// 냉장고 문에 붙여 두는 메모 수의 위. 넘치면 가장 오래된 확인된 메모부터 지워 달라고 안내한다
export const MAX_NOTES_PER_FRIDGE = 50;
// 같은 냉장고에서 이 시간 안에 이어 쓴 메모는 한 번만 알린다
export const NOTE_PUSH_GAP_MINUTES = 5;

interface NoteRow {
  id: string;
  text: string;
  author_id: number | null;
  author_name: string | null;
  created_at: Date;
  checked_by: number | null;
  checked_name: string | null;
  checked_at: Date | null;
}

const SELECT_NOTE = `
  SELECT n.id::text, n.text, n.author_id, n.created_at, n.checked_by, n.checked_at,
    (SELECT ${displayNameSql('a')} FROM users a WHERE a.id = n.author_id) AS author_name,
    (SELECT ${displayNameSql('c')} FROM users c WHERE c.id = n.checked_by) AS checked_name
  FROM fridge_notes n`;

function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    text: row.text,
    author: {
      id: row.author_id === null ? null : String(row.author_id),
      name: row.author_name,
    },
    createdAt: row.created_at,
    checked:
      row.checked_at === null
        ? null
        : {
            by: {
              id: row.checked_by === null ? null : String(row.checked_by),
              name: row.checked_name,
            },
            at: row.checked_at,
          },
  };
}

export async function isBoardEnabled(fridgeId: string): Promise<boolean> {
  const { rows } = await getPool().query<{ enabled: boolean }>(
    `SELECT enabled FROM fridge_features WHERE fridge_id = $1 AND feature = $2`,
    [fridgeId, SHELF_VIEW_EXPERIMENT],
  );
  return rows[0]?.enabled ?? false;
}

// 확인하지 않은 메모를 먼저, 그 안에서는 새 메모부터
export async function listNotes(fridgeId: string): Promise<Note[]> {
  const { rows } = await getPool().query<NoteRow>(
    `${SELECT_NOTE}
     WHERE n.fridge_id = $1
     ORDER BY (n.checked_at IS NOT NULL), n.created_at DESC, n.id DESC
     LIMIT ${MAX_NOTES_PER_FRIDGE}`,
    [fridgeId],
  );
  return rows.map(toNote);
}

export async function createNote(
  fridgeId: string,
  userId: string,
  text: string,
): Promise<Note | 'full'> {
  const { rows } = await getPool().query<NoteRow>(
    `WITH inserted AS (
       INSERT INTO fridge_notes (fridge_id, author_id, text)
       SELECT $1, $2, $3
       WHERE (SELECT count(*) FROM fridge_notes WHERE fridge_id = $1) < ${MAX_NOTES_PER_FRIDGE}
       RETURNING *
     )
     ${SELECT_NOTE.replace('FROM fridge_notes n', 'FROM inserted n')}`,
    [fridgeId, Number(userId), text],
  );
  return rows[0] ? toNote(rows[0]) : 'full';
}

export async function setNoteChecked(
  fridgeId: string,
  noteId: string,
  userId: string,
  checked: boolean,
): Promise<Note | null> {
  const { rows } = await getPool().query<NoteRow>(
    `WITH updated AS (
       UPDATE fridge_notes
       SET checked_by = CASE WHEN $4 THEN $3::int END,
           checked_at = CASE WHEN $4 THEN now() END
       WHERE id = $2 AND fridge_id = $1
       RETURNING *
     )
     ${SELECT_NOTE.replace('FROM fridge_notes n', 'FROM updated n')}`,
    [fridgeId, noteId, Number(userId), checked],
  );
  return rows[0] ? toNote(rows[0]) : null;
}

// 확인된 메모만 지운다. 없거나 아직 확인 전이면 false
export async function deleteCheckedNote(
  fridgeId: string,
  noteId: string,
): Promise<boolean> {
  const { rowCount } = await getPool().query(
    `DELETE FROM fridge_notes
     WHERE id = $2 AND fridge_id = $1 AND checked_at IS NOT NULL`,
    [fridgeId, noteId],
  );
  return (rowCount ?? 0) > 0;
}

// 새 메모를 알릴 가족: 쓴 사람을 뺀 구성원 중 알림을 끄지 않았고(사람별), 이 냉장고 알림을 "받지 않음"으로 두지 않았고,
// 최근 5분 안에 이 냉장고 게시판 알림을 받지 않은 사람. 고르면서 보낸 시각을 바로 적어 겹쳐 보내지 않는다
export async function claimNoteRecipients(
  fridgeId: string,
  authorId: string,
): Promise<string[]> {
  const { rows } = await getPool().query<{ user_id: number }>(
    `WITH candidates AS (
       SELECT m.user_id FROM fridge_members m
       LEFT JOIN notification_settings s ON s.user_id = m.user_id
       WHERE m.fridge_id = $1 AND m.user_id <> $2
         AND COALESCE(s.enabled, true)
         AND m.notify_level IS DISTINCT FROM 'none'
     )
     INSERT INTO fridge_note_pushes (fridge_id, user_id, sent_at)
     SELECT $1, c.user_id, now() FROM candidates c
     ON CONFLICT (fridge_id, user_id) DO UPDATE SET sent_at = EXCLUDED.sent_at
       WHERE fridge_note_pushes.sent_at < now() - interval '${NOTE_PUSH_GAP_MINUTES} minutes'
     RETURNING user_id`,
    [fridgeId, Number(authorId)],
  );
  return rows.map(row => String(row.user_id));
}
