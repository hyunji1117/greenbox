-- db/migrations/0018_item_unit.sql
-- 품목마다 마트 단위를 고를 수 있게 한다 (계란 30구, 두부 1모, 삼겹살 600g)
-- - unit이 비어 있으면 지금처럼 이름으로 단위를 추정한다 (app/lib/items/units.ts)
-- - g 품목은 수량이 그램 수라서 9999까지 받는다. 그 밖의 단위는 지금처럼 99까지
-- - 먹은 양(eaten_quantity)도 같은 단위로 센다. g이면 먹은 그램 수
-- 추가와 범위 넓히기만 하는 변경이라 코드를 이전 커밋으로 되돌려도 그대로 동작한다
-- (예전 코드는 unit을 읽지 않고, 99를 넘는 수량은 g 품목에만 생긴다)
-- 실행: 관리자 계정(vultradmin)으로 greenbox DB에 직접 연결해서 실행한다. (풀 X)

BEGIN;

ALTER TABLE items
  ADD COLUMN unit TEXT CHECK (unit IS NULL OR unit IN (
    '개', '구', '모', '단', '봉', '팩', '통', '포기', '묶음', '마리', '캔', '병', '송이', '장', 'g'
  ));

-- 수량 범위: g만 9999까지, 나머지(단위를 고르지 않은 품목 포함)는 99까지
-- unit이 비어 있으면 unit = 'g'가 NULL이 되어 검사를 통과하므로 IS NOT DISTINCT FROM으로 비교한다
ALTER TABLE items DROP CONSTRAINT items_quantity_check;
ALTER TABLE items ADD CONSTRAINT items_quantity_range
  CHECK (quantity BETWEEN 1 AND 9999 AND (unit IS NOT DISTINCT FROM 'g' OR quantity <= 99));

COMMIT;

-- ==========================================
--   실행 후 확인 (기대값이어야 한다)
-- ==========================================
-- SELECT count(*) FROM items WHERE unit IS NOT NULL;   -- 0
-- SELECT conname FROM pg_constraint WHERE conrelid = 'items'::regclass AND conname LIKE 'items_quantity%';
--   -- items_quantity_range 하나
