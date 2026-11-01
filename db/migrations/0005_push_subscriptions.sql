-- db/migrations/0005_push_subscriptions.sql
-- 서버 푸시를 보낼 기기 정보. 지금까지는 저장하지 않아서 서버가 알림을 보낼 곳을 몰랐다.
-- 실행: 관리자 계정(vultradmin)으로 greenbox DB에 직접 연결해서 실행한다. (풀 X)

-- endpoint는 브라우저와 기기마다 달라서 기기 하나를 구분하는 값으로 쓴다
CREATE TABLE push_subscriptions (
  id         BIGSERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- "이 사용자의 기기 전체" 조회용 (발송 시 사용)
CREATE INDEX push_subscriptions_user_idx ON push_subscriptions (user_id);

-- 만료된 기기 정보를 지워야 하므로 품목과 달리 DELETE도 준다
GRANT SELECT, INSERT, UPDATE, DELETE ON push_subscriptions TO greenbox_app;
GRANT USAGE ON SEQUENCE push_subscriptions_id_seq TO greenbox_app;
