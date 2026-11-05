-- db/migrations/0009_notification_settings.sql
-- 가족마다 생활 시간이 달라서, 알림을 받을 시각과 받을 품목을 사람마다 정하게 한다.
-- - 사람별: 알림 켜기/끄기, 하루 요약 시각, 주간 요약 요일과 시각
-- - 냉장고별: 알림 수준(전체 품목 / 관심 품목만 / 받지 않음). 아직 묻지 않았으면 NULL이고 "관심 품목만"으로 다룬다
-- - 관심 품목: 사람이 종 버튼으로 고른 품목. 내가 넣은 품목은 자동으로 관심 품목
-- - 발송 기록: 매시간 실행이 겹치거나 늦게 실행돼도 하루 요약은 하루 1번, 주간 요약은 주 1번만 보낸다
-- 추가만 하는 변경이라 코드를 이전 커밋으로 되돌려도 그대로 동작한다. (기존 expiry_notification_sends는 남겨 둔다)
-- 새 코드는 이 테이블들을 읽으므로, 배포 전에 이 마이그레이션을 먼저 실행한다.
-- 실행: 관리자 계정(vultradmin)으로 greenbox DB에 직접 연결해서 실행한다. (풀 X)

BEGIN;

-- ==========================================
--          사람별 알림 설정
-- ==========================================
-- 행이 없으면 기본값으로 다룬다 (기본값은 app/lib/notifications/settings.ts와 같게 유지)
-- 요일: 0 일요일 ~ 6 토요일, 시각: 한국 시간 0~23시
CREATE TABLE notification_settings (
  user_id       INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  enabled       BOOLEAN NOT NULL DEFAULT true,
  daily_hour    SMALLINT NOT NULL DEFAULT 8 CHECK (daily_hour BETWEEN 0 AND 23),
  weekly_enabled BOOLEAN NOT NULL DEFAULT true,
  weekly_day    SMALLINT NOT NULL DEFAULT 6 CHECK (weekly_day BETWEEN 0 AND 6),
  weekly_hour   SMALLINT NOT NULL DEFAULT 12 CHECK (weekly_hour BETWEEN 0 AND 23),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
--          냉장고별 알림 수준
-- ==========================================
ALTER TABLE fridge_members
  ADD COLUMN notify_level TEXT CHECK (notify_level IN ('all', 'watched', 'none'));

-- ==========================================
--          관심 품목
-- ==========================================
CREATE TABLE item_watchers (
  item_id    BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (item_id, user_id)
);

-- "내 관심 품목" 조회용
CREATE INDEX item_watchers_user_idx ON item_watchers (user_id);

-- 지금까지 넣은 품목은 넣은 사람의 관심 품목으로 시작한다
-- (혼자 쓰던 냉장고는 지금처럼 모든 품목 알림을 계속 받는다)
INSERT INTO item_watchers (item_id, user_id)
SELECT id, created_by FROM items WHERE created_by IS NOT NULL AND NOT finished
ON CONFLICT DO NOTHING;

-- ==========================================
--          요약 알림 발송 기록
-- ==========================================
-- period: 하루 요약은 보낸 날짜, 주간 요약은 보낸 날짜 (한국 날짜)
CREATE TABLE notification_sends (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind    TEXT NOT NULL CHECK (kind IN ('daily', 'weekly')),
  period  DATE NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, kind, period)
);

-- ==========================================
--          앱 계정(greenbox_app) 권한
-- ==========================================
-- 설정은 지우지 않는다 (탈퇴 시 CASCADE). 관심 품목은 종 버튼을 끄면 지운다
-- 발송 기록은 추가와 조회만 한다
GRANT SELECT, INSERT, UPDATE ON notification_settings TO greenbox_app;
GRANT SELECT, INSERT, DELETE ON item_watchers TO greenbox_app;
GRANT SELECT, INSERT ON notification_sends TO greenbox_app;

COMMIT;

-- ==========================================
--   실행 후 확인 (모두 기대값이어야 한다)
-- ==========================================
-- SELECT count(*) FROM notification_settings;                           -- 0 (모두 기본값)
-- SELECT count(*) FROM fridge_members WHERE notify_level IS NOT NULL;   -- 0 (처음 열 때 묻는다)
-- SELECT (SELECT count(*) FROM item_watchers) AS watchers,
--        (SELECT count(*) FROM items WHERE created_by IS NOT NULL AND NOT finished) AS open_items;
--                                                                       -- 두 값이 같음
