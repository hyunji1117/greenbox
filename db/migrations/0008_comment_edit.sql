-- db/migrations/0008_comment_edit.sql
-- 댓글을 쓴 사람이 내용을 고칠 수 있게 한다. 고친 시각을 남겨 화면에 "수정됨"을 보여 준다.
-- 추가만 하는 변경이라 코드를 이전 커밋으로 되돌려도 그대로 동작한다.
-- 새 코드는 edited_at을 읽으므로, 배포 전에 이 마이그레이션을 먼저 실행한다.
-- 실행: 관리자 계정(vultradmin)으로 greenbox DB에 직접 연결해서 실행한다. (풀 X)

BEGIN;

-- 고친 적이 없으면 NULL
ALTER TABLE item_comments ADD COLUMN edited_at TIMESTAMPTZ;

-- 앱 계정은 내용과 고친 시각만 바꿀 수 있다. 작성자, 품목, 작성 시각은 바꾸지 못한다
GRANT UPDATE (text, edited_at) ON item_comments TO greenbox_app;

COMMIT;

-- ==========================================
--   실행 후 확인 (모두 기대값이어야 한다)
-- ==========================================
-- SELECT count(*) FROM item_comments WHERE edited_at IS NOT NULL;     -- 0
-- SELECT privilege_type FROM information_schema.column_privileges
--  WHERE table_name = 'item_comments' AND grantee = 'greenbox_app' AND privilege_type = 'UPDATE';
--                                                                      -- 2행 (text, edited_at)
