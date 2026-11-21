data "aws_ec2_instance_type" "kanban" {
  instance_type = var.instance_type
}

locals {
  # The instance type alone decides the architecture: t4g.* (Graviton) gets the arm64 AMI, t3a.* the amd64 one
  ami_architecture = contains(data.aws_ec2_instance_type.kanban.supported_architectures, "arm64") ? "arm64" : "amd64"
}

data "aws_ssm_parameter" "ubuntu_ami" {
  name = "/aws/service/canonical/ubuntu/server/24.04/stable/current/${local.ami_architecture}/hvm/ebs-gp3/ami-id"
}

data "aws_vpc" "default" {
  default = true
}

data "aws_caller_identity" "current" {}

resource "aws_key_pair" "deployer" {
  key_name   = "kanban-deployer"
  public_key = file(pathexpand(var.ssh_public_key_path))
}

resource "aws_security_group" "kanban" {
  name        = "kanban"
  description = "Kanban: SSH from the operator, HTTP and HTTPS from anywhere"
  vpc_id      = data.aws_vpc.default.id
}

resource "aws_vpc_security_group_ingress_rule" "ssh" {
  security_group_id = aws_security_group.kanban.id
  cidr_ipv4         = var.ssh_allowed_cidr
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
}

resource "aws_vpc_security_group_ingress_rule" "web" {
  for_each = toset(["80", "443"])

  security_group_id = aws_security_group.kanban.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = tonumber(each.value)
  to_port           = tonumber(each.value)
}

resource "aws_vpc_security_group_egress_rule" "all" {
  security_group_id = aws_security_group.kanban.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_instance" "kanban" {
  ami                    = data.aws_ssm_parameter.ubuntu_ami.value
  instance_type          = var.instance_type
  key_name               = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [aws_security_group.kanban.id]
  iam_instance_profile   = aws_iam_instance_profile.instance.name
  user_data              = file("${path.module}/user-data.sh")

  root_block_device {
    volume_type = "gp3"
    volume_size = 20

    tags = {
      Name                   = "kanban"
      (local.backup_tag.key) = local.backup_tag.value
    }
  }

  metadata_options {
    http_tokens = "required"
  }

  # The AMI lookup returns a newer image whenever Canonical publishes one; without this,
  # the next apply would replace the instance and wipe the database on its disk
  lifecycle {
    ignore_changes = [ami, user_data]
  }

  tags = {
    Name = "kanban"
  }
}

resource "aws_eip" "kanban" {
  instance = aws_instance.kanban.id
  domain   = "vpc"
}

locals {
  sslip_host   = "${replace(aws_eip.kanban.public_ip, ".", "-")}.sslip.io"
  app_domain   = "kanban.${local.sslip_host}"
  ecr_registry = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.region}.amazonaws.com"
}
