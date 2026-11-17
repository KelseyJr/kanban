variable "region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type (ARM/Graviton, matching the arm64 AMI)"
  type        = string
  default     = "t4g.small"
}

variable "ssh_public_key_path" {
  description = "Path to the public key allowed to SSH into the instance"
  type        = string
  default     = "~/.ssh/id_ed25519.pub"
}

variable "ssh_allowed_cidr" {
  description = "Only this CIDR may reach port 22 (your IP: curl -s https://checkip.amazonaws.com, then append /32)"
  type        = string
}
