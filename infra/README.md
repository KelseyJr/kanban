# Infra (AWS)

A study deployment: one EC2 instance runs the whole app with Docker Compose. Built to be created, tried and destroyed.

```
Internet ──► Elastic IP ──► EC2 t4g.small (Ubuntu 24.04, arm64)
                              └─ docker compose (docker-compose.prod.yml)
                                   ├─ caddy     :80/:443, HTTPS via Let's Encrypt
                                   │    ├─ kanban.<ip>.sslip.io ──► frontend:3000 (vite preview, SSR)
                                   │    └─ api.<ip>.sslip.io    ──► backend:3333  (Bun + Elysia)
                                   └─ postgres  (volume postgres-data, not exposed)
```

- `terraform/` creates the key pair, security group (22 from your IP only, 80/443 open), instance and Elastic IP in the default VPC.
- [sslip.io](https://sslip.io) turns the IP into hostnames (`kanban.1-2-3-4.sslip.io` → `1.2.3.4`), so no domain is needed and Caddy can still get real certificates.
- `deploy.sh` rsyncs the repo to the instance and runs `docker compose up -d --build` there. Images are built on the instance; nothing goes through ECR.
- The backend container applies pending migrations on start. `POSTGRES_PASSWORD` is generated on the first deploy and kept in `~/kanban.env` on the instance.
- `VITE_API_URL` is baked into the frontend at build time, so the API domain must be known before the build: `deploy.sh` reads it from the Terraform outputs.

## Cost

Roughly US$ 0.025/hour (instance + public IPv4 + 20 GB gp3), about US$ 17/month if left running. Check current prices in the AWS pricing pages. `terraform destroy` stops all charges.

## Prerequisites

1. An AWS account, and an IAM user (or SSO) with permissions for EC2 and SSM Parameter Store reads. Don't use the root user.
2. AWS CLI and Terraform: `brew install awscli hashicorp/tap/terraform`.
3. Credentials: `aws configure` (or `aws configure sso`), then check with `aws sts get-caller-identity`.
4. An SSH key: `ssh-keygen -t ed25519` (creates `~/.ssh/id_ed25519.pub`).

## Up

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # set ssh_allowed_cidr to "$(curl -s https://checkip.amazonaws.com)/32"
terraform init
terraform plan
terraform apply
cd .. && ./deploy.sh                           # first run: ~5 min (cloud-init + image builds)
```

Run `./deploy.sh` again after each code change.

## Operate

```bash
ssh ubuntu@$(terraform -chdir=terraform output -raw public_ip)
docker compose --env-file ~/kanban.env -f kanban/infra/docker-compose.prod.yml ps
docker compose --env-file ~/kanban.env -f kanban/infra/docker-compose.prod.yml logs -f backend
```

If your IP changes, update `ssh_allowed_cidr` and run `terraform apply` again.

## Down

```bash
cd infra/terraform && terraform destroy
```

This deletes the instance, its disk (and the database with it), the Elastic IP, the security group and the key pair. Afterwards, check the EC2 console of the region for leftovers.
