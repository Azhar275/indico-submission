#!/usr/bin/env bash
set -euo pipefail

SONAR_URL="${SONAR_URL:-http://127.0.0.1:9000}"
SCANNER_HOST_URL="${SCANNER_HOST_URL:-$SONAR_URL}"
SCANNER_NETWORK="${SCANNER_NETWORK:-host}"
SCANNER_IMAGE="${SCANNER_IMAGE:-sonarsource/sonar-scanner-cli@sha256:47956b669bf486bdad919e1cbd0533223515aa0b6d1d31763e5a3754942df6d7}"
PROJECT_KEY="${SONAR_PROJECT_KEY:-items-api}"
SOURCE_DIR="$(cd "${SOURCE_DIR:-app}" && pwd)"
REPORT_DIR="${REPORT_DIR:-reports/sonarqube}"
GATE_NAME="security-gate"

mkdir -p "$REPORT_DIR"

mask() {
  if [[ -n "${GITHUB_ACTIONS:-}" ]]; then
    echo "::add-mask::$1"
  fi
}

api() {
  curl -sf -u "admin:${ADMIN_PASSWORD}" "$@"
}

json() {
  python3 -c "import json,sys; d=json.load(sys.stdin); print($1)"
}

echo "Waiting for SonarQube at $SONAR_URL"
for _ in $(seq 1 90); do
  if curl -sf "$SONAR_URL/api/system/status" 2>/dev/null | grep -q '"status":"UP"'; then
    break
  fi
  sleep 5
done
curl -sf "$SONAR_URL/api/system/status" | grep -q '"status":"UP"'

ADMIN_PASSWORD="$(openssl rand -hex 16)Aa1!"
mask "$ADMIN_PASSWORD"
DEFAULT_PASSWORD="${SONAR_DEFAULT_PASSWORD:-admin}"
curl -sf -u "admin:${DEFAULT_PASSWORD}" -X POST "$SONAR_URL/api/users/change_password" \
  --data-urlencode login=admin \
  --data-urlencode "previousPassword=${DEFAULT_PASSWORD}" \
  --data-urlencode "password=${ADMIN_PASSWORD}"

api -X POST "$SONAR_URL/api/projects/create" -d "project=${PROJECT_KEY}" -d "name=${PROJECT_KEY}" >/dev/null

api -X POST "$SONAR_URL/api/qualitygates/create" -d "name=${GATE_NAME}" >/dev/null
api -X POST "$SONAR_URL/api/qualitygates/create_condition" -d "gateName=${GATE_NAME}" -d metric=vulnerabilities -d op=GT -d error=0 >/dev/null
api -X POST "$SONAR_URL/api/qualitygates/create_condition" -d "gateName=${GATE_NAME}" -d metric=security_hotspots_reviewed -d op=LT -d error=100 >/dev/null
api -X POST "$SONAR_URL/api/qualitygates/select" -d "gateName=${GATE_NAME}" -d "projectKey=${PROJECT_KEY}" >/dev/null

SONAR_TOKEN="$(api -X POST "$SONAR_URL/api/user_tokens/generate" \
  -d name=ci-scan -d type=PROJECT_ANALYSIS_TOKEN -d "projectKey=${PROJECT_KEY}" | json "d['token']")"
mask "$SONAR_TOKEN"

echo "Running SonarScanner on $SOURCE_DIR"
set +e
docker run --rm --network "$SCANNER_NETWORK" \
  -e SONAR_HOST_URL="$SCANNER_HOST_URL" \
  -e SONAR_TOKEN="$SONAR_TOKEN" \
  -v "$SOURCE_DIR:/usr/src:ro" \
  "$SCANNER_IMAGE" \
  -Dsonar.projectKey="$PROJECT_KEY" \
  -Dsonar.sources=src \
  -Dsonar.tests=test \
  -Dsonar.working.directory=/tmp/scannerwork \
  -Dsonar.qualitygate.wait=true \
  -Dsonar.qualitygate.timeout=300 > "$REPORT_DIR/scanner.log" 2>&1
SCAN_EXIT=$?
set -e

api "$SONAR_URL/api/qualitygates/project_status?projectKey=${PROJECT_KEY}" > "$REPORT_DIR/quality-gate.json"
api "$SONAR_URL/api/issues/search?componentKeys=${PROJECT_KEY}&impactSoftwareQualities=SECURITY&ps=500" > "$REPORT_DIR/security-issues.json"
api "$SONAR_URL/api/hotspots/search?project=${PROJECT_KEY}&ps=500" > "$REPORT_DIR/security-hotspots.json"

python3 - "$REPORT_DIR" <<'EOF'
import json, sys, os
d = sys.argv[1]
gate = json.load(open(os.path.join(d, "quality-gate.json")))["projectStatus"]
issues = json.load(open(os.path.join(d, "security-issues.json")))["issues"]
hotspots = json.load(open(os.path.join(d, "security-hotspots.json")))["hotspots"]
print(f"Quality gate: {gate['status']}")
for c in gate.get("conditions", []):
    print(f"  {c['metricKey']}: actual={c.get('actualValue')} {c['comparator']} {c['errorThreshold']} -> {c['status']}")
print(f"Security issues: {len(issues)}")
for i in issues:
    print(f"  [{i.get('rule')}] {i['component'].split(':',1)[-1]}:{i.get('line')} {i['message']}")
print(f"Security hotspots: {len(hotspots)}")
for h in hotspots:
    print(f"  [{h.get('ruleKey')}] {h['component'].split(':',1)[-1]}:{h.get('line')} {h['message']} ({h.get('vulnerabilityProbability')})")
EOF

if [[ $SCAN_EXIT -ne 0 ]]; then
  echo "SAST gate FAILED (scanner exit $SCAN_EXIT). See $REPORT_DIR/scanner.log"
fi
exit $SCAN_EXIT
