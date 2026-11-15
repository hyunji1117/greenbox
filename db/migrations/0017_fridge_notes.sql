-- db/migrations/0017_fridge_notes.sql
-- 가족 게시판: 냉장고 문에 붙이는 메모 (docs/decisions/0012-shelf-view-beta.md 다음 단계)
-- - 가족 누구나 쓰고, 누구나 확인(줄 긋기)하고, 확인된 메모는 누구나 지운다
-- - 기한 없이 지울 때까지 남는다
-- - 새 메모는 다른 가족에게 알린다. 같은 냉장고에서 5분 안에 이어 쓴 메모는 한 번만 알린다(알림 기록)
-- 선반 보기 베타가 켜진 냉장고에서만 쓴다 (개인정보처리방침에 게시판을 넣은 뒤 전체 공개)
-- 추가만 하는 변경이라 코드를 이전 커밋으로 되돌려도 그대로 동작한다
-- 실행: 관리자 계정(vultradmin)으로 greenbox DB에 직접 연결해서 실행한다. (풀 X)

BEGIN;

CREATE TABLE fridge_notes (
  id         BIGSERIAL PRIMARY KEY,
  fridge_id  BIGINT NOT NULL REFERENCES fridges(id) ON DELETE CASCADE,
  -- 탈퇴하면 쓴 사람은 비우고 메모는 남긴다 (가족이 함께 보는 글이라서)
  author_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  text       VARCHAR(60) NOT NULL CHECK (length(btrim(text)) >= 1),
  -- 확인한 사람과 시각. 둘 다 비어 있으면 아직 확인하지 않은 메모
  checked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX fridge_notes_fridge_idx ON fridge_notes (fridge_id, created_at DESC);

-- 받는 사람마다 이 냉장고 게시판 알림을 마지막으로 보낸 시각 (5분 안에는 다시 보내지 않는다)
CREATE TABLE fridge_note_pushes (
  fridge_id BIGINT NOT NULL REFERENCES fridges(id) ON DELETE CASCADE,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sent_at   TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (fridge_id, user_id)
);

-- ==========================================
--          앱 계정(greenbox_app) 권한
-- ==========================================
GRANT SELECT, INSERT, UPDATE, DELETE ON fridge_notes TO greenbox_app;
GRANT USAGE ON SEQUENCE fridge_notes_id_seq TO greenbox_app;
GRANT SELECT, INSERT, UPDATE ON fridge_note_pushes TO greenbox_app;

COMMIT;

-- ==========================================
--   실행 후 확인 (기대값이어야 한다)
-- ==========================================
-- SELECT count(*) FROM fridge_notes;         -- 0
-- SELECT count(*) FROM fridge_note_pushes;   -- 0
