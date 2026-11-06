// app/lib/feedback/store.ts
// 의견 저장과 의견 모음 메일용 조회 (서버 전용)

import { getPool } from '@/app/lib/db';
import type { CreateFeedback } from '@/app/lib/schemas/feedback';

// 방침: 받은 날부터 1년이 지나면 파기
export const FEEDBACK_RETENTION_DAYS = 365;

export async function saveFeedback(
  userId: string,
  input: CreateFeedback,
): Promise<void> {
  await getPool().query(
    `INSERT INTO feedback (user_id, text, input_method, page) VALUES ($1, $2, $3, $4)`,
    [Number(userId), input.text, input.inputMethod, input.page ?? null],
  );
}

export interface FeedbackRow {
  id: string;
  userId: string;
  text: string;
  inputMethod: 'text' | 'voice';
  page: string | null;
  createdAt: Date;
}

// 남아 있는 의견 전체 (오래된 것부터). 엑셀은 매일 이 목록으로 새로 만들어 누적된다
export async function listAllFeedback(): Promise<FeedbackRow[]> {
  const { rows } = await getPool().query<{
    id: string;
    user_id: number;
    text: string;
    input_method: 'text' | 'voice';
    page: string | null;
    created_at: Date;
  }>(
    `SELECT id::text, user_id, text, input_method, page, created_at
     FROM feedback ORDER BY created_at, id`,
  );
  return rows.map(row => ({
    id: row.id,
    userId: String(row.user_id),
    text: row.text,
    inputMethod: row.input_method,
    page: row.page,
    createdAt: row.created_at,
  }));
}

// 마지막으로 메일을 보낸 시각. 보낸 적이 없으면 null
export async function lastDigestSentAt(): Promise<Date | null> {
  const { rows } = await getPool().query<{ sent_at: Date }>(
    `SELECT sent_at FROM feedback_digest_sends ORDER BY sent_on DESC LIMIT 1`,
  );
  return rows[0]?.sent_at ?? null;
}

export async function hasDigestSent(date: string): Promise<boolean> {
  const { rowCount } = await getPool().query(
    `SELECT 1 FROM feedback_digest_sends WHERE sent_on = $1::date`,
    [date],
  );
  return Boolean(rowCount);
}

// 메일을 보낸 뒤 기록한다. 같은 날 이미 기록됐으면 false
export async function recordDigestSent(
  date: string,
  newCount: number,
  totalCount: number,
): Promise<boolean> {
  const { rowCount } = await getPool().query(
    `INSERT INTO feedback_digest_sends (sent_on, new_count, total_count)
     VALUES ($1::date, $2, $3) ON CONFLICT DO NOTHING`,
    [date, newCount, totalCount],
  );
  return rowCount === 1;
}

// 보관 기간이 지난 의견을 지우고 지운 수를 돌려준다
export async function deleteExpiredFeedback(): Promise<number> {
  const { rowCount } = await getPool().query(
    `DELETE FROM feedback WHERE created_at < now() - make_interval(days => $1)`,
    [FEEDBACK_RETENTION_DAYS],
  );
  return rowCount ?? 0;
}
