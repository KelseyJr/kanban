# Infra (AWS)

A study deployment: one EC2 instance runs the whole app with Docker Compose, and the GitHub Actions pipeline deploys every commit on `main` to it. Built to be created, tried and destroyed.

```
GitHub Actions (push on main)
  ├─ OIDC ──► role kanban-github-deploy (only main of this repository)
  ├─ docker push ──► ECR kanban-backend, kanban-frontend   (tag: commit SHA)
  ├─ aws s3 cp infra/release ──► S3 kanban-releases-*/releases/<sha>/
  └─ ssm send-command ──► EC2: download the bundle, run-release.sh

Internet ──► Elastic IP ──► EC2 t4g.small (Ubuntu 24.04, arm64)
                              └─ docker compose, project "kanban" (infra/release/docker-compose.yml)
                                   ├─ caddy  :80/:443, HTTPS via Let's Encrypt, basic auth (all but /api/health)
                                   │    └─ kanban.<ip>.sslip.io
                                   │         ├─ /api/* ──► backend:3333  (Bun + Elysia, prefix stripped)
                                   │         └─ /*     ──► frontend:3000 (vite preview, SSR → backend:3333)
                                   └─ postgres (volume postgres-data, no published port)
```

- `terraform/` creates everything on AWS: key pair, security group (22 from your IP only, 80 and 443 open), instance with its IAM role, Elastic IP, the two ECR repositories, the releases bucket, the GitHub OIDC provider and the deploy role.
- [sslip.io](https://sslip.io) turns the IP into a hostname (`kanban.1-2-3-4.sslip.io` → `1.2.3.4`), so no domain is needed and Caddy still gets a real certificate.
- The pipeline builds the images once, tests them, then pushes those same images to ECR. The instance pulls them with its own role: no registry token and no AWS key live on GitHub or on the instance.
- The backend container applies pending migrations before it starts serving. `POSTGRES_PASSWORD` is generated on the first deploy and kept in `/opt/kanban/.env` on the instance.

## Cost

Roughly US$ 0.024/hour, about US$ 17.5/month if left running, in us-east-1 on demand: the `t4g.small` (about US$ 12.3), its public IPv4 (about US$ 3.7) and 20 GB of gp3 (about US$ 1.6). ECR (ten images per repository) and S3 (release bundles, expired after 30 days) add cents. Check current prices in the AWS pricing pages. `terraform destroy` stops all charges.

## Prerequisites

1. An AWS account, and an IAM user (or SSO) allowed to manage EC2, IAM, ECR, S3 and SSM. Don't use the root user.
2. AWS CLI, Terraform and the Session Manager plugin: `brew install awscli hashicorp/tap/terraform session-manager-plugin`.
3. Credentials: `aws configure` (or `aws configure sso`), then check with `aws sts get-caller-identity`.
4. An SSH key: `ssh-keygen -t ed25519` (creates `~/.ssh/id_ed25519.pub`).
5. The GitHub CLI, logged in to an account with admin access to the repository: `gh auth status`.

## Up

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # set ssh_allowed_cidr to "$(curl -s https://checkip.amazonaws.com)/32"
                                               # and github_repository to the owner/name of this repository
terraform init
terraform plan
terraform apply
```

The instance type decides the architecture of the AMI (`t4g.*` is arm64, `t3a.*` is amd64), and it has to match the platform the pipeline builds (`linux/arm64` on `ubuntu-24.04-arm` runners). Settle it before the first deploy: Terraform ignores AMI changes, so switching architecture later means recreating the instance, and the database with it.

If the account already has the GitHub OIDC provider (another project created it), `terraform apply` fails with `EntityAlreadyExists`. Import it, then apply again:

```bash
terraform import aws_iam_openid_connect_provider.github \
  "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):oidc-provider/token.actions.githubusercontent.com"
```

### Basic auth credentials

Until the app has its own login, Caddy asks for one user and password on every request but `GET /api/health`. The instance reads both from Parameter Store on each deploy:

```bash
read -rp 'User: ' BASIC_AUTH_USER
read -rsp 'Password: ' BASIC_AUTH_PASSWORD && echo
BASIC_AUTH_HASH="$(docker run --rm caddy:2.10.2-alpine caddy hash-password --plaintext "$BASIC_AUTH_PASSWORD")"

aws ssm put-parameter --name /kanban/basic-auth/user --type SecureString --value "$BASIC_AUTH_USER" --overwrite
aws ssm put-parameter --name /kanban/basic-auth/hash --type SecureString --value "$BASIC_AUTH_HASH" --overwrite
unset BASIC_AUTH_PASSWORD
```

### Repository variables

The pipeline reads the Terraform outputs as repository variables. They are identifiers, not secrets: the role only trusts runs on `main` of this repository.

```bash
cd infra/terraform
for output in aws_region aws_role_arn ecr_registry releases_bucket instance_id app_domain; do
  gh variable set "$(echo "$output" | tr '[:lower:]' '[:upper:]')" --body "$(terraform output -raw "$output")"
done
gh variable set DEPLOY_ENABLED --body true
gh variable list   # AWS_REGION, AWS_ROLE_ARN, ECR_REGISTRY, RELEASES_BUCKET, INSTANCE_ID, APP_DOMAIN, DEPLOY_ENABLED
```

`DEPLOY_ENABLED` is the switch: unless it is `true`, the pipeline on `main` runs every check and then only notes in the run summary that publish and deploy were skipped. Set it to `false` (or delete it) before `terraform destroy`, so `main` stays green without the infra.

Then re-run the latest pipeline on `main` (or push a commit) for the first deploy. The first one waits for Caddy to get the certificate. Check that the instance is registered with SSM first: `aws ssm describe-instance-information` lists it as `Online` a few minutes after `terraform apply`.

## Operate

There is no need to open port 22 for anything but your own SSH. Session Manager works from anywhere with your AWS credentials:

```bash
aws ssm start-session --target "$(terraform -chdir=infra/terraform output -raw instance_id)"
sudo docker ps                                       # containers kanban-<service>-1
sudo docker logs -f kanban-backend-1
sudo cat /opt/kanban/current-release                 # the release being served (the hash is in it: don't paste it around)
```

SSH still works from `ssh_allowed_cidr`: `ssh ubuntu@$(terraform -chdir=infra/terraform output -raw public_ip)`. If your IP changes, update `ssh_allowed_cidr` and run `terraform apply` again.

- **Change the password**: run the two `put-parameter` commands of "Basic auth credentials" again, then re-run the latest `deploy` job on `main` (or push a commit). The new password works from that deploy on, and the old one gets 401.
- **Roll back by hand**: in GitHub Actions, open the run of an earlier commit on `main` and re-run its `deploy` job. It redeploys that commit's images, still in ECR (the last ten per repository). To go forward again, re-run the latest `deploy`.
- **Stop deploying**: `gh variable set DEPLOY_ENABLED --body false`.

## Down

```bash
gh variable set DEPLOY_ENABLED --body false
cd infra/terraform && terraform destroy
```

This deletes the instance, its disk (and the database with it), the Elastic IP, the security group, the key pair, both ECR repositories with their images, the releases bucket, the IAM roles and the OIDC provider (if another project uses it, remove it from the state first with `terraform state rm aws_iam_openid_connect_provider.github`). The basic auth parameters were created by hand: delete them with `aws ssm delete-parameters --names /kanban/basic-auth/user /kanban/basic-auth/hash`. Afterwards, check the EC2 console of the region for leftovers.

## Known limits

- **`vite preview` serves the SSR in production.** It was not made for that; a dedicated Bun server is left for another change.
- **One instance, database on its disk, no backup.** `terraform destroy`, or losing the disk, loses the data.
- **A few seconds of 502 on each deploy**, while Compose recreates the containers.
- **Rollback restores images, not the schema**: migrations only add (see "Migrations only add").
- **Let's Encrypt rate limits on `sslip.io`**: certificates live in the `caddy-data` volume and survive deploys. If the limit is hit, point Caddy at the staging CA (`acme_ca https://acme-staging-v02.api.letsencrypt.org/directory` in a global options block of the Caddyfile) until it resets.
- **Compose `--wait`** needs Compose v2; Ubuntu 24.04's `docker-compose-v2` package has it. Check with `docker compose version` on the first deploy.

### Optional hardening

On a GitHub plan that allows it for private repositories:

- **Protect `main`**: require the pipeline's checks (`backend`, `frontend`, `infra`, `e2e`, `release-drill`) before merging.
- **A `production` environment with required reviewers**: add `environment: production` to the `publish` and `deploy` jobs, and change the trust of the deploy role to `sub = repo:<owner>/<repo>:environment:production` in `terraform/github-oidc.tf`. Each deploy then waits for an approval.

## Pipeline

`.github/workflows/pipeline.yml` runs on every pull request and on every push on `main`.

| Job              | Runs on                               | Does                                                                                                          |
| ---------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `backend`        | pull requests and `main`              | `bun ci`, `bun check` and `bun test`, with Postgres as a service                                              |
| `frontend`       | pull requests and `main`              | `bun ci`, `bun check` and `bun run test`                                                                      |
| `infra`          | pull requests and `main`              | `terraform fmt -check`, `terraform validate` and `shellcheck` of the release scripts and `user-data.sh`       |
| `images`         | pull requests and `main`, ARM64       | Builds both images for `linux/arm64` (Buildx, GitHub Actions cache) and saves them as 1-day artifacts         |
| `e2e`            | pull requests and `main`, ARM64       | Loads the images, brings the stack up with `apply-release.sh` and runs Playwright with `E2E_TARGET=stack`     |
| `release-drill`  | pull requests and `main`, ARM64       | Loads the images and runs `apply-release.spec.sh`                                                             |
| `publish`        | `main` with `DEPLOY_ENABLED=true`     | Pushes the tested images to ECR, tagged with the commit SHA, unless the tag is already there; image IDs in the run summary |
| `deploy`         | after `publish`                       | Uploads `infra/release/` to S3, runs `run-release.sh` on the instance through SSM, then checks `/api/health` (200) and `/` (401) from the internet |
| `deploy-skipped` | `main` without `DEPLOY_ENABLED=true`  | Notes in the run summary that publish and deploy were skipped                                                 |

- A pull request never gets AWS credentials: only `publish` and `deploy` ask for an OIDC token, and they only run on pushes on `main`. The deploy role also trusts nothing but `main` of this repository.
- On `main`, runs go one at a time and only the newest push waits in line; on a pull request, a new push cancels the previous run.

### Reading a failed deploy

1. Open the `deploy` job. "Run the release on the instance" prints the stdout and stderr of `run-release.sh`: `apply-release.sh` lists `docker compose ps` and the logs of every service that did not become healthy, then whether the previous release came back.
2. A status of `TimedOut` or `Cancelled` with no output means the command never ran: check that the instance is `Online` in `aws ssm describe-instance-information`.
3. If the release succeeded but "Check the app from the internet" failed, the stack is up on the instance but not reachable: look at the Caddy logs over Session Manager (`sudo docker logs kanban-caddy-1`), usually a certificate problem.
4. When the new release failed, production is back on the previous one. Fix forward with a new commit, or re-run the `deploy` job of an earlier run on `main`.

## Release

`infra/release/` is the bundle that each deploy sends to the instance. The same files bring up the stack in CI, for the E2E suite and the release drill.

| File                    | Role                                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| `docker-compose.yml`    | Postgres (volume, no published port), backend, frontend and Caddy. Images and ports come from variables; the project name is fixed (`kanban`), so the volumes outlive every release |
| `Caddyfile`             | One host: basic auth on everything but `/api/health`, `/api/*` to the backend without the prefix, the rest to the frontend |
| `apply-release.sh`      | Applies a release without talking to AWS; on failure, brings the previous release back and exits with 1  |
| `run-release.sh`        | Instance only: logs in to ECR, reads the basic auth parameters, then calls `apply-release.sh`             |
| `apply-release.spec.sh` | The release drill: a good release, a broken one, and the checks that the rollback worked                 |

`infra/docker-compose.e2e.yml` is an override for the E2E suite: it publishes the backend on port 3334, where the Playwright `api` project and fixtures reach it.

### `apply-release.sh`

| Variable                | Required | Meaning                                                                                       |
| ----------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `RELEASE_ID`            | yes      | Release name; the commit SHA in production                                                    |
| `BACKEND_IMAGE`         | yes      | Backend image, with tag                                                                       |
| `FRONTEND_IMAGE`        | yes      | Frontend image, with tag                                                                      |
| `APP_SITE`              | yes      | Caddy site address: the domain in production (HTTPS), `:80` for plain HTTP                    |
| `APP_URL`               | yes      | The app's origin, used as the backend's `CORS_ORIGIN`                                         |
| `BASIC_AUTH_USER`       | yes      | Basic auth user                                                                               |
| `BASIC_AUTH_HASH`       | yes      | Bcrypt hash of the password, from `caddy hash-password`                                       |
| `STATE_DIR`             | yes      | Where the release state lives (`/opt/kanban` on the instance)                                 |
| `HTTP_PORT`             | no       | Host port for HTTP (80)                                                                       |
| `HTTPS_PORT`            | no       | Host port for HTTPS (443)                                                                     |
| `COMPOSE_OVERRIDE_FILE` | no       | An extra compose file, such as `infra/docker-compose.e2e.yml`                                 |
| `PROJECT_NAME`          | no       | Compose project name (`kanban`). Use another one on a machine that also runs the dev compose, which is also named `kanban` |
| `PRUNE_IMAGES`          | no       | `true` removes every unused image after a good release. `run-release.sh` sets it on the instance, which runs nothing else |

What it does:

1. On the first run, generates `POSTGRES_PASSWORD` in `STATE_DIR/.env` (mode 600).
2. Writes the release to `STATE_DIR/release-env/<RELEASE_ID>.env`, every value single-quoted, so the `$` of the bcrypt hash never goes through Compose interpolation.
3. Runs `docker compose up -d --wait --wait-timeout 180 --remove-orphans`.
4. On success, copies the release file to `STATE_DIR/current-release`, keeps the last five releases in `STATE_DIR/release-history` and removes older release files and bundles (`STATE_DIR/releases/<id>/`).
5. On failure, prints `docker compose ps` and the logs of every service that is not running and healthy, brings up the release in `current-release` (when there is one) and exits with 1.

### Run the stack locally

With Docker and the dev Postgres free to keep running (the stack uses its own project name and ports):

```bash
docker build -t kanban-backend:local backend
docker build -t kanban-frontend:local frontend
export BASIC_AUTH_HASH="$(docker run --rm caddy:2.10.2-alpine caddy hash-password --plaintext secret)"

RELEASE_ID=local BACKEND_IMAGE=kanban-backend:local FRONTEND_IMAGE=kanban-frontend:local \
  APP_SITE=:80 APP_URL=http://localhost:3001 BASIC_AUTH_USER=admin \
  STATE_DIR=/tmp/kanban-stack PROJECT_NAME=kanban-stack HTTP_PORT=3001 HTTPS_PORT=3443 \
  COMPOSE_OVERRIDE_FILE=infra/docker-compose.e2e.yml \
  infra/release/apply-release.sh

curl -i http://localhost:3001/api/health          # 200, no credentials needed
curl -i http://localhost:3001/                    # 401
curl -i -u admin:secret http://localhost:3001/    # 200
```

Tear it down with `docker compose -p kanban-stack down -v` and `rm -rf /tmp/kanban-stack`.

### Run the release drill

```bash
BACKEND_IMAGE=kanban-backend:local FRONTEND_IMAGE=kanban-frontend:local bash infra/release/apply-release.spec.sh
```

It applies release A with the images under test and creates a project, then applies release B with a backend (`busybox:1.37.0`) that never becomes healthy. It passes when `apply-release.sh` exits with an error, `current-release` still points to A, `/api/health` answers 200 and the project is still there. It uses its own project name and ports (3082, 3445), and removes its containers, volumes and networks on exit.

### Migrations only add

A failed release rolls back to the previous images, but not the database: if the new backend applied a migration and then failed, the previous backend runs against the new schema. So a migration only adds (nullable columns, new tables, new indexes). Dropping or renaming a column or table goes in a later change, once no running release reads it.
