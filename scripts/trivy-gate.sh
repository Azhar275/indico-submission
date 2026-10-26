#!/usr/bin/env bash
set -uo pipefail

if [[ $# -ne 3 ]]; then
  echo "usage: $0 <fs|image|config> <target> <report-name>" >&2
  exit 2
fi

KIND="$1"
TARGET="$2"
NAME="$3"
REPORT_DIR="${REPORT_DIR:-reports}"
mkdir -p "$REPORT_DIR"

trivy() {
  if [[ -n "${TRIVY_IMAGE:-}" ]]; then
    docker run --rm -v "$PWD:/work" -w /work -v "${TRIVY_CACHE_DIR:-$HOME/.cache/trivy}:/root/.cache/trivy" "$TRIVY_IMAGE" "$@"
  else
    command trivy "$@"
  fi
}

case "$KIND" in
  fs) ARGS=(fs --scanners vuln "$TARGET"); CACHED=(--skip-db-update) ;;
  image) ARGS=(image --scanners vuln,secret --input "$TARGET"); CACHED=(--skip-db-update) ;;
  config) ARGS=(config "$TARGET" --skip-dirs "$TARGET/bad-examples"); CACHED=() ;;
  *) echo "unknown kind: $KIND" >&2; exit 2 ;;
esac
ARGS+=(--quiet)

trivy "${ARGS[@]}" --format json --output "$REPORT_DIR/$NAME.json"
trivy "${ARGS[@]}" ${CACHED[@]+"${CACHED[@]}"} --format table --output "$REPORT_DIR/$NAME.txt"
cat "$REPORT_DIR/$NAME.txt"

FAILED=0
gate() {
  local label="$1"
  shift
  if trivy "${ARGS[@]}" ${CACHED[@]+"${CACHED[@]}"} --exit-code 1 --format table --output /dev/null "$@"; then
    echo "PASS  $label"
  else
    echo "FAIL  $label"
    FAILED=1
  fi
}

echo
echo "Policy gates for $NAME:"
if [[ "$KIND" == "config" ]]; then
  gate "no HIGH or CRITICAL misconfigurations" --severity HIGH,CRITICAL
else
  gate "no CRITICAL findings" --severity CRITICAL
  gate "no HIGH findings with a fix available" --severity HIGH --ignore-unfixed
fi

exit $FAILED
