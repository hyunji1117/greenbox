// app/lib/db.ts
// Vultr PostgreSQL 연결 풀 (서버 전용)
// - Vultr 커넥션 풀(PgBouncer, transaction 모드)을 거쳐 접속한다.
// - CA 인증서로 서버를 검증한다. 인증서 검증은 끄지 않는다.

import { Pool } from 'pg';

// 개발 서버의 HMR로 모듈이 다시 불려도 풀을 하나만 쓰도록 전역에 보관
const globalForDb = globalThis as unknown as { pgPool?: Pool };

function createPool(): Pool {
  const url = process.env.DATABASE_URL;
  const ca = process.env.DATABASE_CA_CERT;
  if (!url || !ca) {
    throw new Error('DATABASE_URL 또는 DATABASE_CA_CERT 환경변수가 없습니다');
  }

  // URL의 sslmode가 아래 ssl 설정(CA 검증)을 덮어쓰지 않도록 제거
  const connectionString = new URL(url);
  connectionString.searchParams.delete('sslmode');

  return new Pool({
    connectionString: connectionString.toString(),
    ssl: { ca, rejectUnauthorized: true },
    // DB 최대 연결이 22개라 함수 인스턴스마다 적게 잡는다
    max: 5,
    idleTimeoutMillis: 10_000,
  });
}

export function getPool(): Pool {
  if (!globalForDb.pgPool) {
    globalForDb.pgPool = createPool();
  }
  return globalForDb.pgPool;
}
