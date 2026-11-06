-- db/migrations/0010_feedback.sql
-- 이용자 의견 보내기. 글자나 말(브라우저가 글자로 바꾼 것)로 보낸 의견을 저장하고,
-- 매일 아침 한 번 전체 의견을 엑셀로 만들어 운영자 메일로 보낸다.
-- 방침(2026-11-06): 받은 날부터 1년 뒤 파기, 회원 탈퇴 시 함께 파기
-- 추가만 하는 변경이라 코드를 이전 커밋으로 되돌려도 그대로 동작한다.
-- 실행: 관리자 계정(vultradmin)으로 greenbox DB에 직접 연결해서 실행한다. (풀 X)

BEGIN;

CREATE TABLE feedback (
  id           BIGSERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text         VARCHAR(1000) NOT NULL CHECK (btrim(text) <> ''),
  input_method TEXT NOT NULL CHECK (input_method IN ('text', 'voice')),
  -- 어느 화면에서 보냈는지 (탭 이름). 개선할 곳을 찾는 데만 쓴다
  page         VARCHAR(30),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 메일에 "지난번 이후 새 의견"을 고르고, 1년 지난 의견을 지울 때 쓴다
CREATE INDEX feedback_created_idx ON feedback (created_at);

-- 의견 모음 메일 발송 기록. 매시간 실행이 겹쳐도 하루 한 번만 보낸다
CREATE TABLE feedback_digest_sends (
  sent_on        DATE PRIMARY KEY,
  sent_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  new_count      INTEGER NOT NULL,
  total_count    INTEGER NOT NULL
);

-- ==========================================
--          앱 계정(greenbox_app) 권한
-- ==========================================
-- 의견은 고치지 않는다. 1년이 지난 의견을 지우기 위해 DELETE를 준다
GRANT SELECT, INSERT, DELETE ON feedback TO greenbox_app;
GRANT USAGE ON SEQUENCE feedback_id_seq TO greenbox_app;
GRANT SELECT, INSERT ON feedback_digest_sends TO greenbox_app;

COMMIT;

-- ==========================================
--   실행 후 확인 (모두 기대값이어야 한다)
-- ==========================================
-- SELECT count(*) FROM feedback;                -- 0
-- SELECT count(*) FROM feedback_digest_sends;   -- 0
