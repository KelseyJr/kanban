locals {
  log_retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "app" {
  name              = "/kanban/app"
  retention_in_days = local.log_retention_in_days
}

data "aws_iam_policy_document" "instance_logs" {
  statement {
    sid = "ContainerLogs"
    # The awslogs driver creates one stream per container in the group Terraform owns
    actions = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = [
      aws_cloudwatch_log_group.app.arn,
      "${aws_cloudwatch_log_group.app.arn}:log-stream:*",
    ]
  }
}

resource "aws_iam_role_policy" "instance_logs" {
  name   = "kanban-logs"
  role   = aws_iam_role.instance.id
  policy = data.aws_iam_policy_document.instance_logs.json
}
