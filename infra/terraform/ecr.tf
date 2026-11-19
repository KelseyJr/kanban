locals {
  ecr_repository_names = toset(["kanban-backend", "kanban-frontend"])
  kept_images          = 10
}

resource "aws_ecr_repository" "app" {
  for_each = local.ecr_repository_names

  name                 = each.value
  image_tag_mutability = "IMMUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "app" {
  for_each = aws_ecr_repository.app

  repository = each.value.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep the last ${local.kept_images} images, so a manual rollback can redeploy recent commits"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = local.kept_images
      }
      action = { type = "expire" }
    }]
  })
}
