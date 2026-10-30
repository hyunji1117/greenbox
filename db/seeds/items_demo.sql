-- db/seeds/items_demo.sql
-- 시연용 품목. 기존 FridgeContext.tsx 목업(우유, 딸기, 치킨)을 한 사용자에게 넣는다.
-- 운영 DB와 같은 DB라서 지정한 이메일의 사용자에게만 넣는다.
-- 실행: psql ... -v email=본인이메일 -f db/seeds/items_demo.sql

WITH me AS (
  SELECT id FROM users WHERE email = :'email'
),
milk AS (
  INSERT INTO items (user_id, name, category, quantity, added_by, created_at)
  SELECT id, '우유', 'fridge', 1, 'mom', now() - interval '1 day' FROM me
  RETURNING id
)
INSERT INTO item_comments (item_id, author, text, created_at)
SELECT id, 'littleKid', '이거 내일 아침에 먹을거야~', now() - interval '1 hour'
FROM milk;

INSERT INTO items (user_id, name, category, quantity, added_by, created_at)
SELECT id, v.name, v.category, v.quantity, v.added_by, now() - v.ago
FROM users,
  (VALUES
    ('딸기', 'fridge', 1, 'mom', interval '0'),
    ('치킨', 'freezer', 2, 'dad', interval '2 days')
  ) AS v(name, category, quantity, added_by, ago)
WHERE users.email = :'email';
