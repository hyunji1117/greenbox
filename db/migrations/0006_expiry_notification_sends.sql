-- db/migrations/0006_expiry_notification_sends.sql
-- 유통기한 알림 발송 기록. 예약 실행이 같은 날 두 번 들어와도 한 번만 보내기 위해 둔다
-- 실행: 관리자 계정(vultradmin)으로 greenbox DB에 직접 연결해서 실행한다. (풀 X)

CREATE TABLE expiry_notification_sends (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sent_on DATE NOT NULL,
  PRIMARY KEY (user_id, sent_on)
);

GRANT SELECT, INSERT ON expiry_notification_sends TO greenbox_app;
