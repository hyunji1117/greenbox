-- db/migrations/0015_shelf_view_beta.sql
-- 냉장고 모양 선반 보기 베타 (docs/decisions/0012-shelf-view-beta.md)
-- 품목의 선반 자리, 칸마다 선반 수, 실험 허용 목록, 냉장고별 베타 스위치를 둔다
-- 추가만 하는 변경이라 코드를 이전 커밋으로 되돌려도 그대로 동작한다 (예전 코드는 새 칸과 표를 읽지 않는다)
-- 실행: 관리자 계정(vultradmin)으로 greenbox DB에 직접 연결해서 실행한다. (풀 X)

BEGIN;

-- 품목이 놓인 선반 (1번이 맨 위). 비어 있으면 선반을 아직 정하지 않은 품목이다
ALTER TABLE items
  ADD COLUMN shelf SMALLINT,
  ADD CONSTRAINT items_shelf_range CHECK (shelf IS NULL OR shelf BETWEEN 1 AND 7);

-- 칸(냉장/냉동/상온)마다 선반 수. 행이 없으면 기본 5층으로 본다 (app/lib/shelves/rules.ts)
CREATE TABLE fridge_shelves (
  fridge_id   BIGINT NOT NULL REFERENCES fridges(id) ON DELETE CASCADE,
  category    TEXT NOT NULL CHECK (category IN ('fridge', 'freezer', 'pantry')),
  shelf_count SMALLINT NOT NULL DEFAULT 5 CHECK (shelf_count BETWEEN 1 AND 7),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (fridge_id, category)
);

-- 실험 허용 목록. 베타를 켤 수 있는 사람을 SQL 한 줄로 넣고 뺀다 (재배포 없이)
CREATE TABLE experiment_members (
  experiment TEXT NOT NULL,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (experiment, user_id)
);

-- 냉장고별 베타 스위치. 허용 목록에 있는 냉장고 주인만 켜고 끈다. 같은 냉장고 가족 모두에게 적용된다
CREATE TABLE fridge_features (
  fridge_id  BIGINT NOT NULL REFERENCES fridges(id) ON DELETE CASCADE,
  feature    TEXT NOT NULL,
  enabled    BOOLEAN NOT NULL DEFAULT false,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (fridge_id, feature)
);

-- ==========================================
--          앱 계정(greenbox_app) 권한
-- ==========================================
-- items는 이미 UPDATE 권한이 있어 shelf도 바꿀 수 있다 (0004)
GRANT SELECT, INSERT, UPDATE ON fridge_shelves TO greenbox_app;
-- 허용 목록은 앱이 읽기만 한다. 넣고 빼기는 관리자가 직접 한다
GRANT SELECT ON experiment_members TO greenbox_app;
GRANT SELECT, INSERT, UPDATE ON fridge_features TO greenbox_app;

COMMIT;

-- ==========================================
--   실행 후 확인 (기대값이어야 한다)
-- ==========================================
-- SELECT count(*) FROM items WHERE shelf IS NOT NULL;   -- 0
-- SELECT count(*) FROM fridge_shelves;                  -- 0
-- SELECT count(*) FROM experiment_members;              -- 0
-- SELECT count(*) FROM fridge_features;                 -- 0

-- ==========================================
--   테스트 대상 넣기 (관리자, 필요할 때만)
-- ==========================================
-- INSERT INTO experiment_members (experiment, user_id) VALUES ('shelf_view', <사용자 번호>);
-- 빼기: DELETE FROM experiment_members WHERE experiment = 'shelf_view' AND user_id = <사용자 번호>;
