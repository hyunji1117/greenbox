-- db/migrations/0004_items.sql
-- 냉장고 품목과 품목 댓글. 지금까지는 화면 메모리 목업이라 새로고침하면 사라졌다.
-- 가족 기능이 아직 없어서 품목은 로그인 사용자(user_id) 기준으로 저장한다.
-- 가족 연결을 붙일 때 family_id 컬럼을 추가하고 조회 조건만 바꾸면 된다.
-- 실행: 관리자 계정(vultradmin)으로 greenbox DB에 직접 연결해서 실행한다. (풀 X)

-- ==========================================
--              품목
-- ==========================================
CREATE TABLE items (
  id          BIGSERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(50) NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('fridge', 'freezer', 'pantry')),
  quantity    INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  added_by    TEXT NOT NULL,             -- FridgeContext.tsx 의 FamilyMember
  expiry_date DATE,
  finished    BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- "내 품목 최신순" 조회용
CREATE INDEX items_user_created_idx ON items (user_id, created_at DESC);

-- ==========================================
--              품목 댓글
-- ==========================================
CREATE TABLE item_comments (
  id         BIGSERIAL PRIMARY KEY,
  item_id    BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  author     TEXT NOT NULL,              -- FamilyMember
  text       VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX item_comments_item_idx ON item_comments (item_id, created_at);

-- ==========================================
--          앱 계정(greenbox_app) 권한
-- ==========================================
-- 품목 삭제 화면이 없어서 DELETE는 주지 않는다. (회원 탈퇴 시 CASCADE로만 지워짐)
GRANT SELECT, INSERT, UPDATE ON items TO greenbox_app;
GRANT SELECT, INSERT ON item_comments TO greenbox_app;
GRANT USAGE ON SEQUENCE items_id_seq, item_comments_id_seq TO greenbox_app;
