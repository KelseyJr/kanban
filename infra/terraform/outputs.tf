output "public_ip" {
  value = aws_eip.kanban.public_ip
}

output "app_domain" {
  value = "kanban.${local.sslip_host}"
}

output "api_domain" {
  value = "api.${local.sslip_host}"
}

output "app_url" {
  value = "https://kanban.${local.sslip_host}"
}

output "ssh_command" {
  value = "ssh ubuntu@${aws_eip.kanban.public_ip}"
}
