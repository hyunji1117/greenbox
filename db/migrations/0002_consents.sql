-- db/migrations/0002_consents.sql
-- 개인정보 동의 기록.
-- 동의 내역은 증빙 자료라서 앱 계정은 추가와 조회만 할 수 있다. (수정과 삭제 권한 없음)
-- 회원 탈퇴로 users 행이 지워지면 기록도 함께 지워진다. (ON DELETE CASCADE는 테이블 소유자 권한으로 실행됨)

CREATE TABLE consents (
  id             BIGSERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type   TEXT NOT NULL,             -- app/lib/consent/policies.ts 의 ConsentType
  policy_version TEXT NOT NULL,             -- 동의 당시 POLICY_VERSION
  agreed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),  -- 서버 시간
  user_agent     TEXT
);

-- "현재 버전에 동의했는지" 조회용
CREATE INDEX consents_user_version_idx ON consents (user_id, policy_version);

-- ==========================================
--          앱 계정(greenbox_app) 권한
-- ==========================================
GRANT SELECT, INSERT ON consents TO greenbox_app;
GRANT USAGE ON SEQUENCE consents_id_seq TO greenbox_app;
