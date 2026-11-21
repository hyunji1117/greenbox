#!/bin/zsh
# scripts/dev-db.sh
# 이 컴퓨터 안에서만 쓰는 개발용 PostgreSQL. 운영 DB(.env.local)를 건드리지 않고 dev 서버를 띄우기 위해 쓴다
# - 데이터는 홈 폴더(~/.greenbox-dev-db)에 둔다. 임시 폴더에 두면 macOS 정리 때 지워진다 (2026-11-18에 실제로 지워짐)
# - 운영과 같게 관리자 계정으로 마이그레이션을 적용하고, 앱은 권한을 좁힌 greenbox_app 계정으로 SSL(CA 검증) 접속한다
# - 비밀번호와 인증서는 컴퓨터마다 여기서 새로 만들고 저장소에는 넣지 않는다
# - 로그인 비밀키(AUTH_SECRET)도 개발용을 따로 쓴다. 운영 키를 개발에서 쓰지 않고,
#   DB를 새로 만들면 예전 DB의 사용자를 가리키는 로그인 쿠키가 저절로 무효가 되어 다시 로그인하게 된다
#
# 사용법
#   scripts/dev-db.sh setup              처음 한 번: DB 만들기, 인증서, 마이그레이션 적용
#   scripts/dev-db.sh start | stop       DB 켜기 / 끄기
#   scripts/dev-db.sh migrate            아직 적용하지 않은 db/migrations만 적용
#   scripts/dev-db.sh dev [AUTH_URL]     DB를 켜고 이 DB를 보는 dev 서버(3033)를 띄운다
#                                        폰에서 Tailscale 주소로 로그인하려면 그 주소를 AUTH_URL로 넘긴다
#   scripts/dev-db.sh dump [파일]         테스트 데이터를 파일로 저장 (다른 컴퓨터로 옮길 때)
#   scripts/dev-db.sh restore 파일        저장한 파일로 테스트 데이터를 되살린다
#   scripts/dev-db.sh psql               관리자 계정으로 접속
#   scripts/dev-db.sh status             상태 보기
# 지우려면: stop 뒤에 ~/.greenbox-dev-db 폴더를 지운다

set -euo pipefail

ROOT="${0:A:h:h}"
DIR="${GREENBOX_DEV_DB_DIR:-$HOME/.greenbox-dev-db}"
DATA="$DIR/data"
CERTS="$DIR/certs"
PORT="${GREENBOX_DEV_DB_PORT:-55432}"
ADMIN=greenbox_admin
APP=greenbox_app
DB=greenbox

die() { print -u2 -- "dev-db: $*"; exit 1; }
need() { command -v "$1" >/dev/null || die "$1 이 필요해요 (brew install postgresql@17)"; }

admin_psql() { PGOPTIONS="-c client_min_messages=warning" psql -h "$DIR" -p "$PORT" -U "$ADMIN" -v ON_ERROR_STOP=1 -q "$@"; }
is_running() { pg_ctl -D "$DATA" status >/dev/null 2>&1; }

make_certs() {
  mkdir -p "$CERTS" && chmod 700 "$CERTS"
  # 이 컴퓨터만 믿는 CA를 만들고, 그 CA로 localhost와 127.0.0.1용 서버 인증서를 서명한다
  openssl req -x509 -newkey rsa:2048 -nodes -days 3650 -subj "/CN=greenbox-dev-ca" \
    -keyout "$CERTS/ca.key" -out "$CERTS/ca.crt" 2>/dev/null
  openssl req -newkey rsa:2048 -nodes -subj "/CN=localhost" \
    -keyout "$CERTS/server.key" -out "$CERTS/server.csr" 2>/dev/null
  print "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1" >"$CERTS/san.ext"
  openssl x509 -req -in "$CERTS/server.csr" -CA "$CERTS/ca.crt" -CAkey "$CERTS/ca.key" \
    -set_serial "0x$(openssl rand -hex 8)" -days 3650 -extfile "$CERTS/san.ext" -out "$CERTS/server.crt" 2>/dev/null
  chmod 600 "$CERTS"/*.key
}

cmd_setup() {
  need initdb; need openssl
  [[ -e "$DATA/PG_VERSION" ]] && die "이미 있어요: $DATA (지우고 다시 만들려면 stop 뒤 폴더를 지워 주세요)"
  mkdir -p "$DIR" && chmod 700 "$DIR"
  initdb -D "$DATA" -U "$ADMIN" --auth-local=trust --auth-host=reject -E UTF8 --locale=C >/dev/null
  make_certs
  cat >>"$DATA/postgresql.conf" <<EOF

# greenbox 개발용 (scripts/dev-db.sh)
port = $PORT
listen_addresses = 'localhost'
unix_socket_directories = '$DIR'
ssl = on
ssl_cert_file = '$CERTS/server.crt'
ssl_key_file = '$CERTS/server.key'
EOF
  # 앱 계정은 SSL로만, 비밀번호로 접속한다. 관리자는 이 컴퓨터의 소켓으로만 들어온다
  cat >"$DATA/pg_hba.conf" <<EOF
local    all  $ADMIN               trust
hostssl  $DB  $APP  127.0.0.1/32   scram-sha-256
hostssl  $DB  $APP  ::1/128        scram-sha-256
EOF
  local password
  password="$(openssl rand -hex 24)"
  cmd_start
  admin_psql -d postgres -c "CREATE ROLE $APP LOGIN PASSWORD '$password'" \
    -c "CREATE DATABASE $DB"
  print "DATABASE_URL=postgres://$APP:$password@127.0.0.1:$PORT/$DB" >"$DIR/env"
  print "AUTH_SECRET=$(openssl rand -base64 32)" >>"$DIR/env"
  chmod 600 "$DIR/env"
  cmd_migrate
  print "준비됐어요: ${DIR}"
}

cmd_start() {
  is_running && return 0
  pg_ctl -D "$DATA" -l "$DIR/postgres.log" -w start >/dev/null
  print "DB 켜짐 (포트 ${PORT})"
}

cmd_stop() {
  is_running || { print "이미 꺼져 있어요"; return 0; }
  pg_ctl -D "$DATA" -m fast -w stop >/dev/null
  print "DB 꺼짐"
}

cmd_migrate() {
  cmd_start
  admin_psql -d "$DB" -c "CREATE TABLE IF NOT EXISTS dev_migrations (filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())"
  local file name applied=0
  for file in "$ROOT"/db/migrations/*.sql; do
    name="${file:t}"
    [[ -n "$(admin_psql -d "$DB" -Atc "SELECT 1 FROM dev_migrations WHERE filename = '$name'")" ]] && continue
    # 파일 하나를 한 트랜잭션으로 적용한다. 파일이 스스로 BEGIN/COMMIT을 쓰면 그대로 둔다. 실패하면 거기서 멈춘다
    if grep -qiE '^[[:space:]]*BEGIN' "$file"; then
      admin_psql -d "$DB" -f "$file" >/dev/null
    else
      admin_psql -d "$DB" -1 -f "$file" >/dev/null
    fi
    admin_psql -d "$DB" -c "INSERT INTO dev_migrations (filename) VALUES ('$name')"
    print "적용: $name"
    applied=$((applied + 1))
  done
  print "마이그레이션 ${applied}개 적용"
}

cmd_dev() {
  [[ -f "$DIR/env" ]] || die "먼저 scripts/dev-db.sh setup 을 실행해 주세요"
  cmd_start
  # 예전에 만든 폴더에 로그인 비밀키가 없으면 지금 더한다
  grep -q '^AUTH_SECRET=' "$DIR/env" || print "AUTH_SECRET=$(openssl rand -base64 32)" >>"$DIR/env"
  export DATABASE_URL="$(sed -n 's/^DATABASE_URL=//p' "$DIR/env")"
  export AUTH_SECRET="$(sed -n 's/^AUTH_SECRET=//p' "$DIR/env")"
  export DATABASE_CA_CERT="$(cat "$CERTS/ca.crt")"
  [[ -n "${1:-}" ]] && export AUTH_URL="$1"
  cd "$ROOT"
  exec npx next dev -p 3033
}

cmd_dump() {
  cmd_start
  local out="${1:-$DIR/greenbox-dev-$(date +%Y%m%d-%H%M).sql}"
  # 데이터만 저장한다. 스키마는 받는 쪽에서 setup(마이그레이션)으로 만든다
  pg_dump -h "$DIR" -p "$PORT" -U "$ADMIN" -d "$DB" --data-only --exclude-table=dev_migrations >"$out"
  print "저장: $out"
}

cmd_restore() {
  [[ -f "${1:-}" ]] || die "되살릴 파일을 알려 주세요"
  cmd_start
  admin_psql -d "$DB" -1 -f "$1" >/dev/null
  print "되살림: $1"
}

cmd_status() {
  print "폴더: $DIR"
  if is_running; then print "DB: 켜짐 (포트 ${PORT})"; else print "DB: 꺼짐"; fi
  is_running && admin_psql -d "$DB" -Atc "SELECT 'users: ' || count(*) FROM users" 2>/dev/null || true
}

case "${1:-}" in
  setup) cmd_setup ;;
  start) cmd_start ;;
  stop) cmd_stop ;;
  migrate) cmd_migrate ;;
  dev) shift; cmd_dev "${1:-}" ;;
  dump) shift; cmd_dump "${1:-}" ;;
  restore) shift; cmd_restore "${1:-}" ;;
  psql) shift; admin_psql -d "$DB" "$@" ;;
  status) cmd_status ;;
  *) sed -n '2,19p' "${0:A}" | sed 's/^# \{0,1\}//'; exit 1 ;;
esac
