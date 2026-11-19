#!/bin/bash
# Prepares the instance to receive releases: Docker with the Compose v2 plugin and AWS CLI v2.
# The SSM agent already ships with the Ubuntu AMI, and no image is built here, so there is no swap.
set -euo pipefail

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io docker-compose-v2
systemctl enable --now docker

snap install aws-cli --classic

install -d -m 700 /opt/kanban /opt/kanban/releases
