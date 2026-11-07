-- db/migrations/0011_recipes.sql
-- 곧 먹어야 할 재료로 만드는 초간단 레시피. 글은 Claude가, 그림은 이미지 모델이 만든다
-- 같은 재료 조합의 레시피와 그림은 저장해 두고 다시 써서, 두 번째부터는 바로 뜨고 비용이 들지 않는다
-- 레시피에는 재료 이름만 있고 누가 만들었는지는 저장하지 않는다 (사람마다 하루 횟수만 따로 센다)
-- 추가만 하는 변경이라 코드를 이전 커밋으로 되돌려도 그대로 동작한다.
-- 실행: 관리자 계정(vultradmin)으로 greenbox DB에 직접 연결해서 실행한다. (풀 X)

BEGIN;

CREATE TABLE recipes (
  id          BIGSERIAL PRIMARY KEY,
  -- 재료 조합을 정렬해 만든 열쇠. 같은 조합이면 같은 레시피를 다시 쓴다
  cache_key   TEXT NOT NULL UNIQUE,
  title       VARCHAR(60) NOT NULL,
  minutes     SMALLINT NOT NULL CHECK (minutes BETWEEN 1 AND 120),
  -- [{ name, amount, have }] 냉장고에 있는 재료인지(have)와 살 것을 함께 담는다
  ingredients JSONB NOT NULL,
  -- [{ text }] 단계 설명
  steps       JSONB NOT NULL,
  -- 익힘, 알레르기 같은 짧은 주의
  caution     VARCHAR(200),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 레시피 그림. slot 0은 완성 사진, 1부터는 단계 그림 (사용자가 단계를 열 때만 만든다)
CREATE TABLE recipe_images (
  recipe_id  BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  slot       SMALLINT NOT NULL CHECK (slot BETWEEN 0 AND 20),
  mime       TEXT NOT NULL,
  content    BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (recipe_id, slot)
);

-- 사람마다 하루에 새로 만드는 횟수를 센다 (저장된 레시피를 다시 보는 것은 세지 않는다)
CREATE TABLE recipe_generations (
  id         BIGSERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('recipe', 'image')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX recipe_generations_user_idx ON recipe_generations (user_id, created_at);

-- ==========================================
--          앱 계정(greenbox_app) 권한
-- ==========================================
-- 레시피와 그림은 만들고 읽기만 한다. 횟수 기록도 추가와 조회만
GRANT SELECT, INSERT ON recipes, recipe_images, recipe_generations TO greenbox_app;
GRANT USAGE ON SEQUENCE recipes_id_seq, recipe_generations_id_seq TO greenbox_app;

COMMIT;

-- ==========================================
--   실행 후 확인 (모두 기대값이어야 한다)
-- ==========================================
-- SELECT (SELECT count(*) FROM recipes) AS recipes, (SELECT count(*) FROM recipe_images) AS images;  -- 0, 0
