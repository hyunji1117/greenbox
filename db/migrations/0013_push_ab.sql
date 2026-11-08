-- db/migrations/0013_push_ab.sql
-- 알림 문구 A/B: 보낸 알림에 어떤 문구였는지와, 눌러서 연 시각을 함께 남긴다
-- 예전 발송 기록은 비워 둔다 (실험 전). 문구별 열기 비율은 운영 지표 메일에서 본다
-- 추가만 하는 변경이라 코드를 이전 커밋으로 되돌려도 그대로 동작한다.
-- 실행: 관리자 계정(vultradmin)으로 greenbox DB에 직접 연결해서 실행한다. (풀 X)

BEGIN;

ALTER TABLE notification_sends ADD COLUMN variant VARCHAR(10);
ALTER TABLE notification_sends ADD COLUMN opened_at TIMESTAMPTZ;

-- ==========================================
--          앱 계정(greenbox_app) 권한
-- ==========================================
-- 알림을 연 시각만 고칠 수 있다 (문구와 발송 기록은 그대로)
GRANT UPDATE (opened_at) ON notification_sends TO greenbox_app;

COMMIT;

-- ==========================================
--   실행 후 확인 (기대값이어야 한다)
-- ==========================================
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'notification_sends' AND column_name IN ('variant', 'opened_at');  -- 2행
