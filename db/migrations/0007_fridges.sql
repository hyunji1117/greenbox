-- db/migrations/0007_fridges.sql
-- 품목의 주인을 사람에서 냉장고로 옮긴다. 가족이 같은 냉장고를 함께 보고, 한 사람이 냉장고 여러 개에 속할 수 있다.
-- 기존 사용자마다 "내 냉장고"를 만들고 지금까지의 품목과 댓글을 그 냉장고로 옮긴다.
-- 추가만 하는 변경이라 코드를 이전 커밋으로 되돌려도 기존 컬럼(user_id, added_by, author)으로 그대로 동작한다.
-- 기존 컬럼은 안정된 뒤 다음 마이그레이션에서 정리한다.
-- 실행: 관리자 계정(vultradmin)으로 greenbox DB에 직접 연결해서 실행한다. (풀 X)
--       운영 DB 전에 임시 DB(greenbox_restore_test)에 덤프를 복원해 먼저 실행하고 행 수를 확인한다.

BEGIN;

-- ==========================================
--              냉장고
-- ==========================================
CREATE TABLE fridges (
  id         BIGSERIAL PRIMARY KEY,
  name       VARCHAR(20) NOT NULL DEFAULT '내 냉장고',
  -- 만든 사람이 탈퇴해도 냉장고와 품목은 남은 구성원이 계속 쓴다
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
--              냉장고 구성원
-- ==========================================
CREATE TABLE fridge_members (
  fridge_id BIGINT NOT NULL REFERENCES fridges(id) ON DELETE CASCADE,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 함께 보는 사람이 자기 화면에서만 부르는 이름 (예: 딸에게는 "엄마 냉장고")
  -- 비어 있으면 만든 사람이 정한 냉장고 이름을 쓴다. 만든 사람은 냉장고 이름 자체를 바꾼다
  custom_name VARCHAR(20),
  PRIMARY KEY (fridge_id, user_id)
);

-- "내가 속한 냉장고" 조회용 (권한 확인은 기본 키로 충분)
CREATE INDEX fridge_members_user_idx ON fridge_members (user_id, joined_at);

-- ==========================================
--              초대 링크
--   추측하기 어려운 무작위 코드, 24시간 뒤 만료. 새 링크를 만들면 이전 링크는 revoked_at으로 무효
-- ==========================================
CREATE TABLE fridge_invites (
  code       TEXT PRIMARY KEY,
  fridge_id  BIGINT NOT NULL REFERENCES fridges(id) ON DELETE CASCADE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX fridge_invites_fridge_idx ON fridge_invites (fridge_id, created_at DESC);

-- ==========================================
--              참여 요청 (기존 구성원이 승인해야 들어온다)
-- ==========================================
CREATE TABLE fridge_join_requests (
  id          BIGSERIAL PRIMARY KEY,
  fridge_id   BIGINT NOT NULL REFERENCES fridges(id) ON DELETE CASCADE,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code TEXT REFERENCES fridge_invites(code) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  decided_at  TIMESTAMPTZ
);

-- 같은 냉장고에 대기 중인 요청은 한 사람당 하나만
CREATE UNIQUE INDEX fridge_join_requests_pending_idx
  ON fridge_join_requests (fridge_id, user_id) WHERE status = 'pending';

-- ==========================================
--              기존 테이블에 냉장고와 작성자 연결
-- ==========================================
-- 마지막으로 본 냉장고. 다음에 앱을 열면 이 냉장고부터 보여 준다 (권한은 매번 구성원 기록으로 다시 확인)
ALTER TABLE users ADD COLUMN last_fridge_id BIGINT REFERENCES fridges(id) ON DELETE SET NULL;

ALTER TABLE items
  ADD COLUMN fridge_id  BIGINT REFERENCES fridges(id) ON DELETE CASCADE,
  ADD COLUMN created_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE item_comments
  ADD COLUMN author_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- 새 코드는 목업 역할(added_by, author)을 보내지 않는다. 이전 코드로 되돌려도 화면이 깨지지 않도록 기존 형식의 값으로 채운다
ALTER TABLE items ALTER COLUMN added_by SET DEFAULT 'mom';
ALTER TABLE item_comments ALTER COLUMN author SET DEFAULT 'mom';

-- ==========================================
--              기존 데이터 옮기기
-- ==========================================
-- 사용자마다 내 냉장고 1개와 owner 구성원. 사용자 id 순서대로 만들어 대응 관계를 created_by로 찾는다
INSERT INTO fridges (created_by)
SELECT id FROM users ORDER BY id;

INSERT INTO fridge_members (fridge_id, user_id, role)
SELECT f.id, f.created_by, 'owner' FROM fridges f;

UPDATE users u SET last_fridge_id = f.id
FROM fridges f WHERE f.created_by = u.id;

-- 지금까지는 혼자 쓰는 앱이라 품목을 넣은 사람과 댓글을 쓴 사람이 모두 품목의 주인이다
UPDATE items i SET fridge_id = f.id, created_by = i.user_id
FROM fridges f WHERE f.created_by = i.user_id;

UPDATE item_comments c SET author_id = i.user_id
FROM items i WHERE i.id = c.item_id;

-- 값이 다 채워진 뒤에 제약을 건다. 비어 있는 행이 있으면 여기서 실패하고 전체가 되돌아간다
ALTER TABLE items ALTER COLUMN fridge_id SET NOT NULL;

-- "이 냉장고 품목 최신순" 조회용
CREATE INDEX items_fridge_created_idx ON items (fridge_id, created_at DESC);

-- ==========================================
--   이전 코드와의 호환 (마이그레이션 직후 배포 전, 또는 코드를 되돌렸을 때)
--   이전 코드는 fridge_id, created_by, author_id를 보내지 않으므로 넣는 사람 기준으로 채운다.
--   새 코드가 안정되면 다음 마이그레이션에서 기존 컬럼과 함께 지운다
-- ==========================================
CREATE FUNCTION items_fill_fridge() RETURNS trigger AS $$
DECLARE
  target BIGINT;
BEGIN
  IF NEW.fridge_id IS NULL THEN
    SELECT COALESCE(
      (SELECT u.last_fridge_id FROM users u
        JOIN fridge_members m ON m.fridge_id = u.last_fridge_id AND m.user_id = u.id
        WHERE u.id = NEW.user_id),
      (SELECT m.fridge_id FROM fridge_members m
        WHERE m.user_id = NEW.user_id ORDER BY m.joined_at LIMIT 1)
    ) INTO target;
    -- 이전 코드로 가입해 냉장고가 없는 사용자
    IF target IS NULL THEN
      INSERT INTO fridges (created_by) VALUES (NEW.user_id) RETURNING id INTO target;
      INSERT INTO fridge_members (fridge_id, user_id, role) VALUES (target, NEW.user_id, 'owner');
      UPDATE users SET last_fridge_id = target WHERE id = NEW.user_id;
    END IF;
    NEW.fridge_id := target;
  END IF;
  NEW.created_by := COALESCE(NEW.created_by, NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_fill_fridge BEFORE INSERT ON items
  FOR EACH ROW EXECUTE FUNCTION items_fill_fridge();

CREATE FUNCTION item_comments_fill_author() RETURNS trigger AS $$
BEGIN
  IF NEW.author_id IS NULL THEN
    SELECT i.user_id INTO NEW.author_id FROM items i WHERE i.id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER item_comments_fill_author BEFORE INSERT ON item_comments
  FOR EACH ROW EXECUTE FUNCTION item_comments_fill_author();

-- ==========================================
--          앱 계정(greenbox_app) 권한
-- ==========================================
-- 냉장고는 지우지 않는다. 구성원은 내보내기와 나가기 때문에 DELETE까지 준다
-- 초대와 참여 요청은 무효화와 상태 변경만 하므로 DELETE는 주지 않는다
GRANT SELECT, INSERT, UPDATE ON fridges TO greenbox_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON fridge_members TO greenbox_app;
GRANT SELECT, INSERT, UPDATE ON fridge_invites TO greenbox_app;
GRANT SELECT, INSERT, UPDATE ON fridge_join_requests TO greenbox_app;
GRANT USAGE ON SEQUENCE fridges_id_seq, fridge_join_requests_id_seq TO greenbox_app;

COMMIT;

-- ==========================================
--   실행 후 확인 (모두 기대값이어야 한다)
-- ==========================================
-- SELECT (SELECT count(*) FROM users) AS users,
--        (SELECT count(*) FROM fridges) AS fridges,
--        (SELECT count(*) FROM fridge_members) AS members;           -- 세 값이 같음
-- SELECT count(*) FROM items WHERE fridge_id IS NULL OR created_by IS NULL;  -- 0
-- SELECT count(*) FROM item_comments WHERE author_id IS NULL;        -- 0
