-- db/migrations/0014_item_eaten_quantity.sql
-- 개수별 먹음 처리. 계란, 양파처럼 한 번에 다 먹지 않는 품목은 먹은 개수만 따로 센다
-- 처음 산 수량(quantity)은 그대로 두고 싶다는 사용자 의견에 따라, 남은 수량은 quantity - eaten_quantity로 계산한다
-- 추가만 하는 변경이라 코드를 이전 커밋으로 되돌려도 그대로 동작한다 (예전 코드는 이 칸을 읽지 않는다)
-- 실행: 관리자 계정(vultradmin)으로 greenbox DB에 직접 연결해서 실행한다. (풀 X)

BEGIN;

ALTER TABLE items
  ADD COLUMN eaten_quantity INTEGER NOT NULL DEFAULT 0,
  ADD CONSTRAINT items_eaten_quantity_range
    CHECK (eaten_quantity >= 0 AND eaten_quantity <= quantity);

-- 앱 계정은 items 전체에 UPDATE 권한이 있어 따로 줄 권한은 없다 (0004)

COMMIT;

-- ==========================================
--   실행 후 확인 (기대값이어야 한다)
-- ==========================================
-- SELECT count(*) FROM items WHERE eaten_quantity <> 0;  -- 0
