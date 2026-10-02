// app/lib/user/profile.ts
// 로그인 사용자 프로필 조회와 가족 내 호칭 저장 (서버 전용)

import { getPool } from '@/app/lib/db';
import type { MyProfile } from './displayName';

export async function getMyProfile(userId: string): Promise<MyProfile | null> {
  const { rows } = await getPool().query<{
    name: string | null;
    email: string | null;
    image: string | null;
    family_nickname: string | null;
  }>(
    'SELECT name, email, image, family_nickname FROM users WHERE id = $1',
    [Number(userId)],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    name: row.name,
    email: row.email,
    image: row.image,
    familyNickname: row.family_nickname,
  };
}

// 빈 값이면 호칭을 지워서 구글 이름으로 돌아간다
export async function setFamilyNickname(
  userId: string,
  nickname: string | null,
): Promise<void> {
  await getPool().query('UPDATE users SET family_nickname = $1 WHERE id = $2', [
    nickname,
    Number(userId),
  ]);
}
