-- db/migrations/0016_feature_changes.sql
-- 냉장고별 베타 스위치를 누가, 언제, 어느 쪽으로 바꿨는지 한 줄씩 남긴다
-- 가족 누구나 스위치를 바꿀 수 있게 되면서 마지막으로 바꾼 사람(fridge_features.updated_by)만으로는
-- 몇 번 바뀌었는지, 주인과 나중에 들어온 가족 중 누가 바꾸는지 알 수 없다. 다음 베타 대상을 정할 때 참고한다
-- 바꾸는 순간의 역할, 들어온 순서, 가족 수를 함께 적어 두어 가족이 나중에 나가도 기록이 그대로 남는다
-- 추가만 하는 변경이라 코드를 이전 커밋으로 되돌려도 그대로 동작한다
-- 실행: 관리자 계정(vultradmin)으로 greenbox DB에 직접 연결해서 실행한다. (풀 X)

BEGIN;

CREATE TABLE fridge_feature_changes (
  id           BIGSERIAL PRIMARY KEY,
  fridge_id    BIGINT NOT NULL REFERENCES fridges(id) ON DELETE CASCADE,
  feature      TEXT NOT NULL,
  enabled      BOOLEAN NOT NULL,
  -- 탈퇴하면 사람은 비우고 역할과 순서는 남긴다
  changed_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  member_role  TEXT NOT NULL CHECK (member_role IN ('owner', 'member')),
  -- 냉장고에 들어온 순서 (주인이 1, 처음 초대받아 들어온 가족이 2)
  join_rank    SMALLINT NOT NULL CHECK (join_rank >= 1),
  member_count SMALLINT NOT NULL CHECK (member_count >= 1),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 설정 화면의 "마지막으로 바꾼 사람" 조회용
CREATE INDEX fridge_feature_changes_latest_idx
  ON fridge_feature_changes (fridge_id, feature, created_at DESC);

-- ==========================================
--          앱 계정(greenbox_app) 권한
-- ==========================================
-- 기록은 쌓기만 한다. 고치거나 지우지 않는다
GRANT SELECT, INSERT ON fridge_feature_changes TO greenbox_app;
GRANT USAGE ON SEQUENCE fridge_feature_changes_id_seq TO greenbox_app;

COMMIT;

-- ==========================================
--   실행 후 확인 (기대값이어야 한다)
-- ==========================================
-- SELECT count(*) FROM fridge_feature_changes;   -- 0

-- ==========================================
--   분석 예시: 역할과 들어온 순서별로 켜고 끈 횟수
-- ==========================================
-- SELECT member_role, join_rank, enabled, count(*)
-- FROM fridge_feature_changes
-- WHERE feature = 'shelf_view' AND fridge_id <> 1
-- GROUP BY 1, 2, 3 ORDER BY 1, 2, 3;
