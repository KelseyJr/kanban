locals {
  backup_tag = {
    key   = "Backup"
    value = "kanban-daily"
  }
  backup_time_utc       = "06:00"
  kept_daily_snapshots  = 7
  seconds_in_a_day      = 24 * 60 * 60
  backup_alarm_topic    = "kanban-backup-alerts"
  backup_snapshots_name = "kanban-daily"
}

data "aws_iam_policy_document" "dlm_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["dlm.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "dlm" {
  name               = "kanban-dlm"
  assume_role_policy = data.aws_iam_policy_document.dlm_assume_role.json
}

resource "aws_iam_role_policy_attachment" "dlm" {
  role       = aws_iam_role.dlm.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSDataLifecycleManagerServiceRole"
}

resource "aws_dlm_lifecycle_policy" "daily_snapshots" {
  description        = "Daily snapshots of the Kanban instance disk"
  execution_role_arn = aws_iam_role.dlm.arn
  state              = "ENABLED"

  policy_details {
    resource_types = ["VOLUME"]
    target_tags    = { (local.backup_tag.key) = local.backup_tag.value }

    schedule {
      name = "daily"
      # Copying the volume tags would bring its Name along with the one below, and DLM rejects duplicate keys
      copy_tags   = false
      tags_to_add = { Name = local.backup_snapshots_name }

      create_rule {
        interval      = 24
        interval_unit = "HOURS"
        times         = [local.backup_time_utc]
      }

      retain_rule {
        count = local.kept_daily_snapshots
      }
    }
  }
}

resource "aws_sns_topic" "backup_alerts" {
  name = local.backup_alarm_topic
}

resource "aws_sns_topic_subscription" "backup_alerts_email" {
  topic_arn = aws_sns_topic.backup_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# A policy in error creates nothing and says nothing, so the alarm watches for snapshots that did not happen
resource "aws_cloudwatch_metric_alarm" "no_daily_snapshot" {
  alarm_name          = "kanban-no-daily-snapshot"
  alarm_description   = "No snapshot of the Kanban disk completed in the last day: check the DLM policy state"
  namespace           = "AWS/EBS"
  metric_name         = "SnapshotsCreateCompleted"
  dimensions          = { DLMPolicyId = aws_dlm_lifecycle_policy.daily_snapshots.id }
  statistic           = "Sum"
  period              = local.seconds_in_a_day
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "LessThanThreshold"
  treat_missing_data  = "breaching"
  alarm_actions       = [aws_sns_topic.backup_alerts.arn]
  ok_actions          = [aws_sns_topic.backup_alerts.arn]
}
