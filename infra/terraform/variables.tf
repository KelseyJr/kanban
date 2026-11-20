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

variable "github_oidc_subject_prefix" {
  description = "Start of the sub claim GitHub puts in this repository's OIDC tokens: repo:owner/name, or repo:owner@owner_id/name@repository_id when the repository uses immutable subjects (read it with: gh api repos/OWNER/NAME/actions/oidc/customization/sub --jq .sub_claim_prefix)"
  type        = string

  validation {
    condition     = can(regex("^repo:[A-Za-z0-9_.-]+(@[0-9]+)?/[A-Za-z0-9_.-]+(@[0-9]+)?$", var.github_oidc_subject_prefix))
    error_message = "Use the sub_claim_prefix GitHub reports, such as repo:octo-org/kanban or repo:octo-org@123/kanban@456."
  }
}
