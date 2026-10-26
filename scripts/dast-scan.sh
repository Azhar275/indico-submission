#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZAP_IMAGE="${ZAP_IMAGE:-zaproxy/zap-stable@sha256:5ccfff9a411743ab2615136a2edd7416bec9ce41572fa94e935df38c14adb2b6}"
REPORT_DIR="$ROOT/${REPORT_DIR:-reports/zap}"
PROJECT="items-dast"
COMPOSE=(docker compose -p "$PROJECT" -f "$ROOT/docker-compose.yml")

export DB_PASSWORD
DB_PASSWORD="$(openssl rand -hex 16)"
export JWT_SECRET
JWT_SECRET="$(openssl rand -hex 32)"
export SEED_USER_PASSWORD
SEED_USER_PASSWORD="$(openssl rand -hex 12)"
export SEED_USER_EMAIL="dast@example.com"
export JWT_EXPIRES_IN_MS=3600000
export PORT="${PORT:-3000}"

mask() {
  if [[ -n "${GITHUB_ACTIONS:-}" ]]; then
    echo "::add-mask::$1"
  fi
}
mask "$DB_PASSWORD"
mask "$JWT_SECRET"
mask "$SEED_USER_PASSWORD"

cleanup() {
  "${COMPOSE[@]}" logs --no-color app > "$REPORT_DIR/app.log" 2>&1 || true
  "${COMPOSE[@]}" down -v >/dev/null 2>&1 || true
}
trap cleanup EXIT

mkdir -p "$REPORT_DIR"
chmod 777 "$REPORT_DIR"
cp "$ROOT/app/openapi.yaml" "$ROOT/.zap/rules.tsv" "$REPORT_DIR/"

echo "Starting ephemeral test environment (PostgreSQL + API) on an isolated Docker network"
"${COMPOSE[@]}" up -d --no-build --wait db app
"${COMPOSE[@]}" exec -T app node src/seed.js

TOKEN="$(curl -sf -X POST "http://127.0.0.1:${PORT}/auth/login" \
  -H 'content-type: application/json' \
  -d "{\"email\":\"${SEED_USER_EMAIL}\",\"password\":\"${SEED_USER_PASSWORD}\"}" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["token"])')"
mask "$TOKEN"
echo "Authenticated as the seeded test user; ZAP will send the bearer token on every request"

set +e
docker run --rm --network "${PROJECT}_default" \
  -v "$REPORT_DIR:/zap/wrk:rw" \
  -e ZAP_AUTH_HEADER=Authorization \
  -e ZAP_AUTH_HEADER_VALUE="Bearer ${TOKEN}" \
  "$ZAP_IMAGE" zap-api-scan.py \
  -t /zap/wrk/openapi.yaml -f openapi -O http://app:3000 \
  -c rules.tsv -I -s \
  -r zap-report.html -J zap-report.json -w zap-report.md
ZAP_EXIT=$?
set -e

if [[ $ZAP_EXIT -eq 0 ]]; then
  echo "DAST gate PASSED: no release-blocking alerts"
elif [[ $ZAP_EXIT -eq 1 ]]; then
  echo "DAST gate FAILED: release-blocking alerts found (see FAIL-NEW lines above)"
else
  echo "DAST gate FAILED: ZAP exited with $ZAP_EXIT"
fi
exit $ZAP_EXIT
