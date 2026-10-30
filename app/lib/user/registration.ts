// app/lib/user/registration.ts
// 가입 (서버 전용)
// 동의해야 가입된다: 구글 로그인만으로는 DB에 아무것도 저장하지 않고,
// 필수 항목에 동의하는 순간 회원, 구글 계정 연결, 동의 기록을 한 트랜잭션으로 저장한다.

import { getPool } from '@/app/lib/db';
import { recordConsents } from '@/app/lib/consent/record';
import type { ConsentType } from '@/app/lib/consent/policies';

export interface GoogleProfile {
  googleId: string; // 구글 계정 식별자 (accounts.providerAccountId)
  name: string | null;
  email: string | null;
  image: string | null;
}

// 구글 계정으로 가입한 회원 id. 가입 전이면 null
export async function findUserIdByGoogleId(
  googleId: string,
): Promise<string | null> {
  const { rows } = await getPool().query<{ userId: number }>(
    `SELECT "userId" FROM accounts
     WHERE provider = 'google' AND "providerAccountId" = $1`,
    [googleId],
  );
  return rows[0] ? String(rows[0].userId) : null;
}

// 동의와 함께 가입한다. 이미 가입한 구글 계정이면 동의 기록만 남긴다.
export async function registerWithConsents(
  profile: GoogleProfile,
  types: ConsentType[],
  userAgent: string | null,
): Promise<string> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query<{ userId: number }>(
      `SELECT "userId" FROM accounts
       WHERE provider = 'google' AND "providerAccountId" = $1`,
      [profile.googleId],
    );
    let userId = existing.rows[0]?.userId;

    if (!userId) {
      const user = await client.query<{ id: number }>(
        `INSERT INTO users (name, email, image) VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, image = EXCLUDED.image
         RETURNING id`,
        [profile.name, profile.email, profile.image],
      );
      userId = user.rows[0].id;
      await client.query(
        `INSERT INTO accounts ("userId", type, provider, "providerAccountId")
         VALUES ($1, 'oidc', 'google', $2)`,
        [userId, profile.googleId],
      );
    }

    await recordConsents(String(userId), types, userAgent, client);
    await client.query('COMMIT');
    return String(userId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
