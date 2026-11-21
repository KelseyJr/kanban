locals {
  kanban_parameters_arn = "arn:aws:ssm:${var.region}:${data.aws_caller_identity.current.account_id}:parameter/kanban/*"
}

data "aws_iam_policy_document" "instance_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "instance" {
  name               = "kanban-instance"
  assume_role_policy = data.aws_iam_policy_document.instance_assume_role.json
}

resource "aws_iam_role_policy_attachment" "instance_ssm" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

data "aws_iam_policy_document" "instance_release" {
  statement {
    sid = "EcrLogin"
    # GetAuthorizationToken has no resource-level permissions
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid       = "EcrPull"
    actions   = ["ecr:BatchCheckLayerAvailability", "ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer"]
    resources = [for repository in aws_ecr_repository.app : repository.arn]
  }

  statement {
    sid       = "ReleaseBundleRead"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.releases.arn}/${local.releases_prefix}*"]
  }

  statement {
    sid       = "ReleaseBundleList"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.releases.arn]

    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["${local.releases_prefix}*"]
    }
  }

  statement {
    sid       = "BasicAuthParameters"
    actions   = ["ssm:GetParameter"]
    resources = [local.kanban_parameters_arn]
  }

  statement {
    sid = "DenyParametersOutsideKanban"
    # AmazonSSMManagedInstanceCore allows these reads on every parameter; an explicit Deny is the only way to narrow it
    effect        = "Deny"
    actions       = ["ssm:GetParameter", "ssm:GetParameters"]
    not_resources = [local.kanban_parameters_arn]
  }
}

resource "aws_iam_role_policy" "instance_release" {
  name   = "kanban-release"
  role   = aws_iam_role.instance.id
  policy = data.aws_iam_policy_document.instance_release.json
}

resource "aws_iam_instance_profile" "instance" {
  name = "kanban-instance"
  role = aws_iam_role.instance.name
}
