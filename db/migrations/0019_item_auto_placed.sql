-- db/migrations/0019_item_auto_placed.sql
-- 선반 보기 정식 전환: 선반 없이 들어가 있던 품목을 앱이 추천 자리에 놓고, 사람이 맞는지 확인하게 한다
-- (docs/decisions/0012-shelf-view-beta.md)
-- - auto_placed_at: 앱이 놓은 때. 값이 있으면 "앱이 놓았고 아직 확인하지 않음"이라 화면에 점선으로 보인다
-- - 사람이 선반을 다시 정하면(같은 자리여도) 비운다
-- - 자동 배치 자체는 추천 규칙(app/lib/shelves/recommend.ts)이 TypeScript라 SQL이 아니라 서버(/api/fridges/[id]/shelves/auto-place)가 한다
-- 추가만 하는 변경이라 코드를 이전 커밋으로 되돌려도 그대로 동작한다 (예전 코드는 이 칸을 읽지 않는다)
-- 실행: 관리자 계정(vultradmin)으로 greenbox DB에 직접 연결해서 실행한다. (풀 X)

ALTER TABLE items ADD COLUMN auto_placed_at TIMESTAMPTZ;

-- 앱 계정은 items에 UPDATE 권한이 이미 있다 (0004_items.sql)
