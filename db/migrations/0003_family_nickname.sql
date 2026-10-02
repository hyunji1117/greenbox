-- db/migrations/0003_family_nickname.sql
-- 가족 내 호칭. 있으면 화면에 구글 이름 대신 표시한다.
-- 앱 계정(greenbox_app)은 users에 UPDATE 권한이 이미 있다. (0001_auth.sql)

ALTER TABLE users ADD COLUMN family_nickname VARCHAR(20);
