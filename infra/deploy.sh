#!/usr/bin/env bash
# Syncs the repository to the EC2 instance created by infra/terraform and (re)starts the production stack there.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TERRAFORM_DIR="$REPO_ROOT/infra/terraform"
REMOTE_DIR="kanban"
REMOTE_ENV_FILE="kanban.env"
SSH_RETRY_ATTEMPTS=30
SSH_RETRY_DELAY_IN_SECONDS=5

read_output() {
  terraform -chdir="$TERRAFORM_DIR" output -raw "$1"
}

PUBLIC_IP="$(read_output public_ip)"
APP_DOMAIN="$(read_output app_domain)"
API_DOMAIN="$(read_output api_domain)"
SSH_TARGET="ubuntu@$PUBLIC_IP"
SSH_OPTIONS=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=5)

wait_for_ssh() {
  for _ in $(seq "$SSH_RETRY_ATTEMPTS"); do
    if ssh "${SSH_OPTIONS[@]}" "$SSH_TARGET" true 2>/dev/null; then return 0; fi
    sleep "$SSH_RETRY_DELAY_IN_SECONDS"
  done
  echo "Could not reach $SSH_TARGET over SSH" >&2
  exit 1
}

echo "Waiting for $SSH_TARGET to finish provisioning..."
wait_for_ssh
ssh "${SSH_OPTIONS[@]}" "$SSH_TARGET" 'cloud-init status --wait > /dev/null'

echo "Syncing the repository..."
rsync -az --delete -e "ssh ${SSH_OPTIONS[*]}" \
  --exclude '.git' --exclude 'node_modules' --exclude 'dist' --exclude 'coverage' \
  --exclude '.tanstack' --exclude 'test-results' --exclude 'playwright-report' \
  --exclude '.env' --exclude '.env.*' --exclude '.remember' --exclude '.impeccable' \
  --exclude 'infra/terraform' \
  "$REPO_ROOT/" "$SSH_TARGET:$REMOTE_DIR/"

echo "Starting the stack..."
ssh "${SSH_OPTIONS[@]}" "$SSH_TARGET" bash -s -- "$APP_DOMAIN" "$API_DOMAIN" "$REMOTE_DIR" "$REMOTE_ENV_FILE" <<'REMOTE'
set -euo pipefail
APP_DOMAIN="$1"; API_DOMAIN="$2"; REMOTE_DIR="$3"; REMOTE_ENV_FILE="$4"

if [ ! -f "$REMOTE_ENV_FILE" ]; then
  umask 077
  echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)" > "$REMOTE_ENV_FILE"
fi

POSTGRES_PASSWORD_LINE="$(grep '^POSTGRES_PASSWORD=' "$REMOTE_ENV_FILE")"
cat > "$REMOTE_ENV_FILE" <<ENV
$POSTGRES_PASSWORD_LINE
APP_SITE=$APP_DOMAIN
API_SITE=$API_DOMAIN
APP_URL=https://$APP_DOMAIN
API_URL=https://$API_DOMAIN
ENV

docker compose --env-file "$REMOTE_ENV_FILE" -f "$REMOTE_DIR/infra/docker-compose.prod.yml" up -d --build --remove-orphans
docker image prune -f > /dev/null
REMOTE

echo "Deployed: https://$APP_DOMAIN (API: https://$API_DOMAIN)"
