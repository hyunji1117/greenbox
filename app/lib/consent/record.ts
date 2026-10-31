// app/lib/consent/record.ts
// 동의 기록 저장과 조회 (서버 전용)
// 앱 계정은 consents에 추가와 조회만 할 수 있다. (db/migrations/0002_consents.sql)

import { getPool } from '@/app/lib/db';
import {
  POLICY_VERSION,
  hasAllRequired,
  isConsentType,
  type ConsentType,
} from './policies';

// 현재 방침 버전으로 동의 기록을 남긴다. 동의 시각은 DB 서버 시간(now())
export async function recordConsents(
  userId: string,
  types: ConsentType[],
  userAgent: string | null,
): Promise<void> {
  if (types.length === 0) return;
  await getPool().query(
    `INSERT INTO consents (user_id, consent_type, policy_version, user_agent)
     SELECT $1, t, $3, $4 FROM unnest($2::text[]) AS t`,
    [Number(userId), types, POLICY_VERSION, userAgent?.slice(0, 500) ?? null],
  );
}

// 현재 방침의 필수 항목에 모두 동의했으면 그 버전을, 아니면 null
export async function getAgreedPolicyVersion(
  userId: string,
): Promise<string | null> {
  const { rows } = await getPool().query<{ consent_type: string }>(
    `SELECT DISTINCT consent_type FROM consents
     WHERE user_id = $1 AND policy_version = $2`,
    [Number(userId), POLICY_VERSION],
  );
  const agreed = rows.map(r => r.consent_type).filter(isConsentType);
  return hasAllRequired(agreed) ? POLICY_VERSION : null;
}
