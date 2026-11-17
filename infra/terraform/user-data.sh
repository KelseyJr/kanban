#!/bin/bash
set -euo pipefail

# 2 GB swap: the frontend's Vite build does not fit in t4g.small's 2 GB of RAM alone
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io docker-compose-v2 docker-buildx rsync
systemctl enable --now docker
usermod -aG docker ubuntu
