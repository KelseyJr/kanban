#!/usr/bin/env bash
# Release drill: applies a good release, then a broken one, and checks that apply-release.sh
# fails, restores the good release and keeps the data. Runs in CI on every pull request.
#
# Required: BACKEND_IMAGE, FRONTEND_IMAGE (the images under test)
# Optional: HTTP_PORT (3082), HTTPS_PORT (3445)
set -euo pipefail

readonly DRILL_PROJECT_NAME=kanban-drill
# Exits right away and never answers the backend healthcheck
readonly BROKEN_BACKEND_IMAGE=busybox:1.37.0
readonly CADDY_IMAGE=caddy:2.10.2-alpine
readonly DRILL_BASIC_AUTH_USER=drill
readonly HEALTH_RETRIES=30
readonly HEALTH_RETRY_DELAY_IN_SECONDS=1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HTTP_PORT="${HTTP_PORT:-3082}"
HTTPS_PORT="${HTTPS_PORT:-3445}"
BASE_URL="http://localhost:${HTTP_PORT}"
STATE_DIR="$(mktemp -d)"
BASIC_AUTH_PASSWORD="$(openssl rand -hex 16)"
PROJECT_NAME_UNDER_TEST="drill-$(openssl rand -hex 4)"
FAILURES=0

log() {
  echo "[release-drill] $*" >&2
}

clean_up() {
  local exit_status=$?
  log "Removing the drill containers, volumes and networks"
  local filter="label=com.docker.compose.project=${DRILL_PROJECT_NAME}"
  docker ps -aq --filter "${filter}" | xargs -r docker rm -f > /dev/null
  docker volume ls -q --filter "${filter}" | xargs -r docker volume rm > /dev/null
  docker network ls -q --filter "${filter}" | xargs -r docker network rm > /dev/null
  rm -rf "${STATE_DIR}"
  exit "${exit_status}"
}

check() {
  local description="$1"
  shift
  if "$@"; then
    log "PASS ${description}"
    return
  fi

  log "FAIL ${description}"
  FAILURES=$((FAILURES + 1))
}

apply_release() {
  local release_id="$1"
  local backend_image="$2"
  RELEASE_ID="${release_id}" BACKEND_IMAGE="${backend_image}" FRONTEND_IMAGE="${FRONTEND_IMAGE}" \
    APP_SITE=":80" APP_URL="${BASE_URL}" BASIC_AUTH_USER="${DRILL_BASIC_AUTH_USER}" BASIC_AUTH_HASH="${BASIC_AUTH_HASH}" \
    STATE_DIR="${STATE_DIR}" PROJECT_NAME="${DRILL_PROJECT_NAME}" HTTP_PORT="${HTTP_PORT}" HTTPS_PORT="${HTTPS_PORT}" \
    "${SCRIPT_DIR}/apply-release.sh"
}

create_project() {
  curl -fsS -u "${DRILL_BASIC_AUTH_USER}:${BASIC_AUTH_PASSWORD}" -H 'content-type: application/json' \
    -d "{\"name\":\"${PROJECT_NAME_UNDER_TEST}\"}" "${BASE_URL}/api/projects" > /dev/null
}

current_release_is() {
  local expected_release_id="$1"
  grep -qxF "RELEASE_ID='${expected_release_id}'" "${STATE_DIR}/current-release"
}

health_answers_ok() {
  local attempt
  for ((attempt = 1; attempt <= HEALTH_RETRIES; attempt++)); do
    if curl -fsS -o /dev/null "${BASE_URL}/api/health"; then return 0; fi
    sleep "${HEALTH_RETRY_DELAY_IN_SECONDS}"
  done

  return 1
}

project_still_exists() {
  curl -fsS -u "${DRILL_BASIC_AUTH_USER}:${BASIC_AUTH_PASSWORD}" "${BASE_URL}/api/projects" | grep -qF "\"${PROJECT_NAME_UNDER_TEST}\""
}

broken_release_fails() {
  ! apply_release release-b "${BROKEN_BACKEND_IMAGE}"
}

main() {
  if [[ -z "${BACKEND_IMAGE:-}" || -z "${FRONTEND_IMAGE:-}" ]]; then
    log "Set BACKEND_IMAGE and FRONTEND_IMAGE to the images under test"
    exit 1
  fi
  trap clean_up EXIT
  BASIC_AUTH_HASH="$(docker run --rm "${CADDY_IMAGE}" caddy hash-password --plaintext "${BASIC_AUTH_PASSWORD}")"

  log "Release A: the images under test"
  apply_release release-a "${BACKEND_IMAGE}"
  create_project

  log "Release B: a backend that never becomes healthy"
  check "apply-release.sh exits with an error for the broken release" broken_release_fails
  check "current-release still points to release A" current_release_is release-a
  check "/api/health answers 200 after the rollback" health_answers_ok
  check "the project created on release A is still there" project_still_exists

  if ((FAILURES > 0)); then
    log "${FAILURES} check(s) failed"
    exit 1
  fi
  log "All checks passed"
}

main "$@"
