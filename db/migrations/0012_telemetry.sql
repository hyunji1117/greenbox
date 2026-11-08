-- db/migrations/0012_telemetry.sql
-- 실제 사용자 기기의 성능 지표(web-vitals)와 화면 오류를 모은다
-- 누구의 기록인지 남기지 않는다 (회원 번호, 주소의 검색어, 기기 식별자 없음). 화면 경로와 기기 종류만 남긴다
-- 받은 날부터 90일이 지나면 매일 아침 운영 지표 메일을 만들 때 지운다
-- 추가만 하는 변경이라 코드를 이전 커밋으로 되돌려도 그대로 동작한다.
-- 실행: 관리자 계정(vultradmin)으로 greenbox DB에 직접 연결해서 실행한다. (풀 X)

BEGIN;

CREATE TABLE web_vitals (
  id              BIGSERIAL PRIMARY KEY,
  metric          TEXT NOT NULL CHECK (metric IN ('LCP', 'CLS', 'INP', 'FCP', 'TTFB')),
  -- 밀리초 (CLS는 점수)
  value           REAL NOT NULL CHECK (value >= 0),
  rating          TEXT NOT NULL CHECK (rating IN ('good', 'needs-improvement', 'poor')),
  -- 화면 경로와 탭 이름만 (예: / , /?tab=fridge 는 'fridge')
  page            VARCHAR(40) NOT NULL,
  device          TEXT NOT NULL CHECK (device IN ('mobile', 'desktop')),
  navigation_type VARCHAR(20),
  app_version     VARCHAR(20) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX web_vitals_created_idx ON web_vitals (created_at);

CREATE TABLE client_errors (
  id          BIGSERIAL PRIMARY KEY,
  -- error: 잡히지 않은 오류 / rejection: 처리되지 않은 Promise 실패 / render: 화면 그리기 오류
  kind        TEXT NOT NULL CHECK (kind IN ('error', 'rejection', 'render')),
  message     VARCHAR(300) NOT NULL,
  -- 코드 위치를 찾는 데만 쓴다. 앞부분만 저장
  stack       VARCHAR(2000),
  page        VARCHAR(40) NOT NULL,
  device      TEXT NOT NULL CHECK (device IN ('mobile', 'desktop')),
  browser     VARCHAR(20) NOT NULL,
  app_version VARCHAR(20) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX client_errors_created_idx ON client_errors (created_at);

-- 운영 지표 메일 발송 기록. 매시간 실행이 겹쳐도 하루 한 번만 보낸다
CREATE TABLE ops_digest_sends (
  sent_on DATE PRIMARY KEY,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
--          앱 계정(greenbox_app) 권한
-- ==========================================
-- 수집 기록은 고치지 않는다. 90일이 지난 기록을 지우기 위해 DELETE를 준다
GRANT SELECT, INSERT, DELETE ON web_vitals, client_errors TO greenbox_app;
GRANT USAGE ON SEQUENCE web_vitals_id_seq, client_errors_id_seq TO greenbox_app;
GRANT SELECT, INSERT ON ops_digest_sends TO greenbox_app;

COMMIT;

-- ==========================================
--   실행 후 확인 (모두 기대값이어야 한다)
-- ==========================================
-- SELECT (SELECT count(*) FROM web_vitals) AS vitals, (SELECT count(*) FROM client_errors) AS errors;  -- 0, 0
