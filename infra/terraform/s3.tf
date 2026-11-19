locals {
  releases_prefix           = "releases/"
  release_retention_in_days = 30
}

resource "aws_s3_bucket" "releases" {
  bucket_prefix = "kanban-releases-"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "releases" {
  bucket = aws_s3_bucket.releases.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "releases" {
  bucket = aws_s3_bucket.releases.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "releases" {
  bucket = aws_s3_bucket.releases.id

  rule {
    id     = "expire-release-bundles"
    status = "Enabled"

    filter {
      prefix = local.releases_prefix
    }

    expiration {
      days = local.release_retention_in_days
    }
  }
}
