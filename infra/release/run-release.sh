#!/usr/bin/env bash
# Runs on the EC2 instance only, started by the deploy job through SSM Run Command.
# Logs in to ECR and reads the basic auth credentials with the instance role, then applies the release.
#
# Required: RELEASE_ID (commit SHA), AWS_REGION, ECR_REGISTRY, APP_DOMAIN
set -euo pipefail

readonly STATE_DIR=/opt/kanban
readonly BASIC_AUTH_USER_PARAMETER=/kanban/basic-auth/user
readonly BASIC_AUTH_HASH_PARAMETER=/kanban/basic-auth/hash

BUNDLE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() {
  echo "[run-release] $*" >&2
}

require_inputs() {
  local key
  for key in RELEASE_ID AWS_REGION ECR_REGISTRY APP_DOMAIN; do
    if [[ -z "${!key:-}" ]]; then
      log "Missing required variable ${key}"
      exit 1
    fi
  done
}

read_parameter() {
  local name="$1"
  aws ssm get-parameter --region "${AWS_REGION}" --name "${name}" --with-decryption --query Parameter.Value --output text
}

main() {
  require_inputs

  log "Logging in to ${ECR_REGISTRY}"
  aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${ECR_REGISTRY}"

  BASIC_AUTH_USER="$(read_parameter "${BASIC_AUTH_USER_PARAMETER}")"
  BASIC_AUTH_HASH="$(read_parameter "${BASIC_AUTH_HASH_PARAMETER}")"

  export BASIC_AUTH_USER BASIC_AUTH_HASH
  export BACKEND_IMAGE="${ECR_REGISTRY}/kanban-backend:${RELEASE_ID}"
  export FRONTEND_IMAGE="${ECR_REGISTRY}/kanban-frontend:${RELEASE_ID}"
  export APP_SITE="${APP_DOMAIN}"
  export APP_URL="https://${APP_DOMAIN}"
  export STATE_DIR
  export COMPOSE_OVERRIDE_FILE="${BUNDLE_DIR}/docker-compose.aws-logs.yml"
  # The instance runs nothing but this stack, so every unused image is safe to remove
  export PRUNE_IMAGES=true

  "${BUNDLE_DIR}/apply-release.sh"
}

main "$@"
