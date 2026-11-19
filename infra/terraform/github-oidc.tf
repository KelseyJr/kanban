locals {
  github_oidc_host = "token.actions.githubusercontent.com"
}

# One per AWS account: if the account already has it, import it (see infra/README.md)
resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://${local.github_oidc_host}"
  client_id_list = ["sts.amazonaws.com"]
}

data "aws_iam_policy_document" "github_deploy_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.github_oidc_host}:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Only runs on the main branch of this repository can assume the role
    condition {
      test     = "StringEquals"
      variable = "${local.github_oidc_host}:sub"
      values   = ["repo:${var.github_repository}:ref:refs/heads/main"]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  name               = "kanban-github-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_deploy_assume_role.json
}

data "aws_iam_policy_document" "github_deploy" {
  statement {
    sid = "EcrLogin"
    # GetAuthorizationToken has no resource-level permissions
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid = "EcrPush"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:CompleteLayerUpload",
      "ecr:DescribeImages",
      "ecr:InitiateLayerUpload",
      "ecr:PutImage",
      "ecr:UploadLayerPart",
    ]
    resources = [for repository in aws_ecr_repository.app : repository.arn]
  }

  statement {
    sid       = "ReleaseBundleUpload"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.releases.arn}/${local.releases_prefix}*"]
  }

  statement {
    sid     = "RunRelease"
    actions = ["ssm:SendCommand"]
    resources = [
      aws_instance.kanban.arn,
      "arn:aws:ssm:${var.region}::document/AWS-RunShellScript",
    ]
  }

  statement {
    sid = "ReadReleaseResult"
    # GetCommandInvocation has no resource-level permissions
    actions   = ["ssm:GetCommandInvocation"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "github_deploy" {
  name   = "kanban-deploy"
  role   = aws_iam_role.github_deploy.id
  policy = data.aws_iam_policy_document.github_deploy.json
}
