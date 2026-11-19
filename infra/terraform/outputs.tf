output "aws_region" {
  value = var.region
}

output "aws_role_arn" {
  value = aws_iam_role.github_deploy.arn
}

output "ecr_registry" {
  value = local.ecr_registry
}

output "releases_bucket" {
  value = aws_s3_bucket.releases.bucket
}

output "instance_id" {
  value = aws_instance.kanban.id
}

output "app_domain" {
  value = local.app_domain
}

output "app_url" {
  value = "https://${local.app_domain}"
}

output "public_ip" {
  value = aws_eip.kanban.public_ip
}

output "ssh_command" {
  value = "ssh ubuntu@${aws_eip.kanban.public_ip}"
}
