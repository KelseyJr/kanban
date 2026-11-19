variable "region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type; it also picks the AMI architecture (t4g.* is arm64, t3a.* is amd64), which must match the platform of the images the pipeline builds"
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

variable "github_repository" {
  description = "GitHub repository allowed to deploy, as owner/name; only runs on its main branch can assume the deploy role"
  type        = string

  validation {
    condition     = can(regex("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$", var.github_repository))
    error_message = "Use the owner/name form, such as octo-org/kanban."
  }
}
