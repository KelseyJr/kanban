#!/usr/bin/env bash
# Applies one release of the Kanban stack with Docker Compose, without talking to AWS.
# On failure it brings the previous release back up and exits with code 1.
#
# Required: RELEASE_ID, BACKEND_IMAGE, FRONTEND_IMAGE, APP_SITE, APP_URL,
#           BASIC_AUTH_USER, BASIC_AUTH_HASH, STATE_DIR
# Optional: HTTP_PORT (80), HTTPS_PORT (443), COMPOSE_OVERRIDE_FILE, PROJECT_NAME (kanban),
#           PRUNE_IMAGES (false; removes every unused image, so only for a host that runs nothing else)
set -euo pipefail

readonly WAIT_TIMEOUT_IN_SECONDS=180
readonly KEPT_RELEASES=5
readonly LOG_TAIL_LINES=100
readonly RELEASE_KEYS=(RELEASE_ID BUNDLE_DIR COMPOSE_OVERRIDE_FILE BACKEND_IMAGE FRONTEND_IMAGE APP_SITE APP_URL BASIC_AUTH_USER BASIC_AUTH_HASH HTTP_PORT HTTPS_PORT)

# BUNDLE_DIR is read indirectly through RELEASE_KEYS when the release file is written
# shellcheck disable=SC2034
BUNDLE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HTTP_PORT="${HTTP_PORT:-80}"
HTTPS_PORT="${HTTPS_PORT:-443}"
COMPOSE_OVERRIDE_FILE="${COMPOSE_OVERRIDE_FILE:-}"
PROJECT_NAME="${PROJECT_NAME:-kanban}"
PRUNE_IMAGES="${PRUNE_IMAGES:-false}"
RELEASE_ID="${RELEASE_ID:-}"
STATE_DIR="${STATE_DIR:-}"

log() {
  echo "[apply-release] $*" >&2
}

require_inputs() {
  local key
  for key in RELEASE_ID BACKEND_IMAGE FRONTEND_IMAGE APP_SITE APP_URL BASIC_AUTH_USER BASIC_AUTH_HASH STATE_DIR; do
    if [[ -z "${!key:-}" ]]; then
      log "Missing required variable ${key}"
      exit 1
    fi
  done

  for key in "${RELEASE_KEYS[@]}"; do
    # Values are written single-quoted, which keeps the $ of the bcrypt hash away from Compose interpolation
    if [[ "${!key}" == *"'"* || "${!key}" == *$'\n'* ]]; then
      log "Variable ${key} must not contain a single quote or a newline"
      exit 1
    fi
  done

  if [[ -n "${COMPOSE_OVERRIDE_FILE}" ]]; then
    COMPOSE_OVERRIDE_FILE="$(cd "$(dirname "${COMPOSE_OVERRIDE_FILE}")" && pwd)/$(basename "${COMPOSE_OVERRIDE_FILE}")"
  fi
}

ensure_postgres_password() {
  local secrets_file="${STATE_DIR}/.env"
  if [[ -f "${secrets_file}" ]]; then return; fi

  log "Generating POSTGRES_PASSWORD in ${secrets_file}"
  (umask 077 && printf "POSTGRES_PASSWORD='%s'\n" "$(openssl rand -hex 24)" > "${secrets_file}")
}

write_release_file() {
  local release_file="$1"
  local key
  (
    umask 077
    for key in "${RELEASE_KEYS[@]}"; do
      printf "%s='%s'\n" "${key}" "${!key}"
    done > "${release_file}"
  )
}

read_release_value() {
  local release_file="$1"
  local key="$2"
  sed -n "s/^${key}='\(.*\)'\$/\1/p" "${release_file}"
}

# Runs Compose for the release described by a release file. The subshell drops the caller's
# release variables, because Compose prefers the process environment over --env-file
compose_for_release() {
  local release_file="$1"
  shift
  local bundle_dir override_file
  bundle_dir="$(read_release_value "${release_file}" BUNDLE_DIR)"
  override_file="$(read_release_value "${release_file}" COMPOSE_OVERRIDE_FILE)"

  local compose_files=(-f "${bundle_dir}/docker-compose.yml")
  if [[ -n "${override_file}" ]]; then compose_files+=(-f "${override_file}"); fi

  (
    unset "${RELEASE_KEYS[@]}" POSTGRES_PASSWORD COMPOSE_FILE COMPOSE_PROJECT_NAME
    docker compose -p "${PROJECT_NAME}" --env-file "${STATE_DIR}/.env" --env-file "${release_file}" \
      "${compose_files[@]}" "$@"
  )
}

start_release() {
  local release_file="$1"
  compose_for_release "${release_file}" up -d --wait --wait-timeout "${WAIT_TIMEOUT_IN_SECONDS}" --remove-orphans
}

show_failure_details() {
  local release_file="$1"
  compose_for_release "${release_file}" ps -a || true

  local service state health
  while IFS=$'\t' read -r service state health; do
    if [[ "${state}" == "running" && ( -z "${health}" || "${health}" == "healthy" ) ]]; then continue; fi

    log "Logs of ${service} (state: ${state}, health: ${health:-none})"
    compose_for_release "${release_file}" logs --no-color --tail "${LOG_TAIL_LINES}" "${service}" || true
  done < <(compose_for_release "${release_file}" ps -a --format '{{.Service}}{{"\t"}}{{.State}}{{"\t"}}{{.Health}}' || true)
}

roll_back() {
  local current_release_file="${STATE_DIR}/current-release"
  if [[ ! -f "${current_release_file}" ]]; then
    log "No previous release to restore"
    return
  fi

  local previous_release_id
  previous_release_id="$(read_release_value "${current_release_file}" RELEASE_ID)"
  log "Restoring previous release ${previous_release_id}"
  if start_release "${current_release_file}"; then
    log "Previous release ${previous_release_id} restored"
    return
  fi

  log "Previous release ${previous_release_id} did not come back healthy either"
  show_failure_details "${current_release_file}"
}

record_release() {
  local release_file="$1"
  local release_id="$2"
  cp "${release_file}" "${STATE_DIR}/current-release"

  local history_file="${STATE_DIR}/release-history"
  { grep -vxF "${release_id}" "${history_file}" 2>/dev/null || true; echo "${release_id}"; } > "${history_file}.next"
  tail -n "${KEPT_RELEASES}" "${history_file}.next" > "${history_file}"
  rm -f "${history_file}.next"
}

remove_old_releases() {
  local history_file="${STATE_DIR}/release-history"
  local entry release_id
  for entry in "${STATE_DIR}"/release-env/*.env "${STATE_DIR}"/releases/*; do
    if [[ ! -e "${entry}" ]]; then continue; fi

    release_id="$(basename "${entry}" .env)"
    if grep -qxF "${release_id}" "${history_file}"; then continue; fi

    log "Removing old release ${release_id} ($(basename "$(dirname "${entry}")"))"
    rm -rf "${entry}"
  done

  if [[ "${PRUNE_IMAGES}" == "true" ]]; then docker image prune -af; fi
}

main() {
  require_inputs
  mkdir -p "${STATE_DIR}/release-env"
  ensure_postgres_password

  local release_file="${STATE_DIR}/release-env/${RELEASE_ID}.env"
  write_release_file "${release_file}"

  log "Applying release ${RELEASE_ID}"
  if start_release "${release_file}"; then
    record_release "${release_file}" "${RELEASE_ID}"
    remove_old_releases
    log "Release ${RELEASE_ID} is up"
    return
  fi

  log "Release ${RELEASE_ID} did not become healthy (wait timeout: ${WAIT_TIMEOUT_IN_SECONDS}s)"
  show_failure_details "${release_file}"
  roll_back
  exit 1
}

main "$@"
