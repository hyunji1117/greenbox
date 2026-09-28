-- db/migrations/0001_auth.sql
-- Auth.js(@auth/pg-adapter) 표준 테이블.
-- 컬럼 이름은 어댑터가 그대로 쓰므로 바꾸지 않는다. (camelCase 컬럼은 따옴표 필수)
-- 실행: 관리자 계정(vultradmin)으로 greenbox DB에 직접 연결해서 실행한다. (풀 X)

-- ==========================================
--              사용자
-- ==========================================
CREATE TABLE users (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(255),
  email           VARCHAR(255) UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image           TEXT
);

-- ==========================================
--         연결된 로그인 계정 (구글)
-- ==========================================
CREATE TABLE accounts (
  id                  SERIAL PRIMARY KEY,
  "userId"            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                VARCHAR(255) NOT NULL,
  provider            VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token       TEXT,
  access_token        TEXT,
  expires_at          BIGINT,
  id_token            TEXT,
  scope               TEXT,
  session_state       TEXT,
  token_type          TEXT,
  UNIQUE (provider, "providerAccountId")
);

-- ==========================================
--   세션 / 인증 토큰
--   JWT 방식이라 지금은 쓰지 않지만 어댑터 규격이라 만들어 둔다.
-- ==========================================
CREATE TABLE sessions (
  id             SERIAL PRIMARY KEY,
  "userId"       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires        TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE verification_token (
  identifier TEXT NOT NULL,
  expires    TIMESTAMPTZ NOT NULL,
  token      TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- ==========================================
--          앱 계정(greenbox_app) 권한
-- ==========================================
GRANT SELECT, INSERT, UPDATE, DELETE
  ON users, accounts, sessions, verification_token
  TO greenbox_app;

GRANT USAGE ON SEQUENCE users_id_seq, accounts_id_seq, sessions_id_seq
  TO greenbox_app;
