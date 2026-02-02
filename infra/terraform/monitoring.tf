# ============================================================================
# Log Analytics Workspace
# ============================================================================

resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.project_name}-${var.environment}-${var.location_short}-law"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = var.environment == "production" ? 90 : 30

  # Daily quota
  daily_quota_gb = var.environment == "production" ? 10 : 1

  tags = merge(var.tags, {
    Environment = var.environment
    Service     = "Log Analytics"
  })
}

# ============================================================================
# Application Insights
# ============================================================================

resource "azurerm_application_insights" "main" {
  name                = "${var.project_name}-${var.environment}-${var.location_short}-ai"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"

  # Retention
  retention_in_days = var.environment == "production" ? 90 : 30

  # Sampling
  sampling_percentage = var.environment == "production" ? 10 : 100

  # Disable IP masking for internal analytics
  disable_ip_masking = true

  tags = merge(var.tags, {
    Environment = var.environment
    Service     = "Application Insights"
  })
}

# ============================================================================
# Log Analytics Solutions
# ============================================================================

resource "azurerm_log_analytics_solution" "container_insights" {
  solution_name         = "ContainerInsights"
  location              = azurerm_resource_group.main.location
  resource_group_name   = azurerm_resource_group.main.name
  workspace_resource_id = azurerm_log_analytics_workspace.main.id
  workspace_name        = azurerm_log_analytics_workspace.main.name

  plan {
    publisher = "Microsoft"
    product   = "OMSGallery/ContainerInsights"
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

resource "azurerm_log_analytics_solution" "security_center" {
  count                 = var.environment == "production" ? 1 : 0
  solution_name         = "Security"
  location              = azurerm_resource_group.main.location
  resource_group_name   = azurerm_resource_group.main.name
  workspace_resource_id = azurerm_log_analytics_workspace.main.id
  workspace_name        = azurerm_log_analytics_workspace.main.name

  plan {
    publisher = "Microsoft"
    product   = "OMSGallery/Security"
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# ============================================================================
# Action Groups for Alerts
# ============================================================================

resource "azurerm_monitor_action_group" "critical" {
  name                = "${var.project_name}-${var.environment}-critical-ag"
  resource_group_name = azurerm_resource_group.main.name
  short_name          = "critical"

  # Email notifications
  email_receiver {
    name          = "ops-team"
    email_address = "ops@example.com"
    use_common_alert_schema = true
  }

  # Webhook for PagerDuty, Slack, etc.
  # webhook_receiver {
  #   name                    = "pagerduty"
  #   service_uri             = "https://events.pagerduty.com/integration/..."
  #   use_common_alert_schema = true
  # }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

resource "azurerm_monitor_action_group" "warning" {
  name                = "${var.project_name}-${var.environment}-warning-ag"
  resource_group_name = azurerm_resource_group.main.name
  short_name          = "warning"

  email_receiver {
    name          = "dev-team"
    email_address = "dev@example.com"
    use_common_alert_schema = true
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# ============================================================================
# Metric Alerts
# ============================================================================

# AKS CPU alert
resource "azurerm_monitor_metric_alert" "aks_cpu" {
  name                = "${var.project_name}-${var.environment}-aks-cpu-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_kubernetes_cluster.main.id]
  description         = "Alert when AKS cluster CPU usage exceeds threshold"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "Microsoft.ContainerService/managedClusters"
    metric_name      = "node_cpu_usage_percentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 85
  }

  action {
    action_group_id = azurerm_monitor_action_group.warning.id
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# AKS Memory alert
resource "azurerm_monitor_metric_alert" "aks_memory" {
  name                = "${var.project_name}-${var.environment}-aks-memory-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_kubernetes_cluster.main.id]
  description         = "Alert when AKS cluster memory usage exceeds threshold"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "Microsoft.ContainerService/managedClusters"
    metric_name      = "node_memory_working_set_percentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 85
  }

  action {
    action_group_id = azurerm_monitor_action_group.warning.id
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# PostgreSQL storage alert
resource "azurerm_monitor_metric_alert" "postgres_storage" {
  name                = "${var.project_name}-${var.environment}-postgres-storage-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_postgresql_flexible_server.main.id]
  description         = "Alert when PostgreSQL storage usage exceeds threshold"
  severity            = 1
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/flexibleServers"
    metric_name      = "storage_percent"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 85
  }

  action {
    action_group_id = azurerm_monitor_action_group.critical.id
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# Redis cache hit rate alert
resource "azurerm_monitor_metric_alert" "redis_cache_misses" {
  name                = "${var.project_name}-${var.environment}-redis-cache-misses-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_redis_cache.main.id]
  description         = "Alert when Redis cache miss rate is high"
  severity            = 3
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "Microsoft.Cache/redis"
    metric_name      = "cachemissrate"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 20
  }

  action {
    action_group_id = azurerm_monitor_action_group.warning.id
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# ============================================================================
# Scheduled Query Alerts
# ============================================================================

# API error rate alert
resource "azurerm_monitor_scheduled_query_rules_alert_v2" "api_error_rate" {
  name                = "${var.project_name}-${var.environment}-api-error-rate"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  scopes              = [azurerm_application_insights.main.id]
  description         = "Alert when API error rate exceeds threshold"
  severity            = 2
  evaluation_frequency = "PT5M"
  window_duration      = "PT15M"

  criteria {
    query                   = <<-QUERY
      requests
      | where success == false
      | summarize ErrorCount = count() by bin(timestamp, 5m)
      | where ErrorCount > 10
    QUERY
    time_aggregation_method = "Count"
    threshold               = 10
    operator                = "GreaterThan"

    failing_periods {
      minimum_failing_periods_to_trigger_alert = 2
      number_of_evaluation_periods             = 4
    }
  }

  action {
    action_groups = [azurerm_monitor_action_group.critical.id]
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# Policy violation alert
resource "azurerm_monitor_scheduled_query_rules_alert_v2" "policy_violations" {
  name                = "${var.project_name}-${var.environment}-policy-violations"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  scopes              = [azurerm_application_insights.main.id]
  description         = "Alert when policy violations are detected"
  severity            = 1
  evaluation_frequency = "PT5M"
  window_duration      = "PT15M"

  criteria {
    query                   = <<-QUERY
      traces
      | where customDimensions.event_type == "policy_violation"
      | summarize ViolationCount = count() by bin(timestamp, 5m)
      | where ViolationCount > 0
    QUERY
    time_aggregation_method = "Count"
    threshold               = 0
    operator                = "GreaterThan"

    failing_periods {
      minimum_failing_periods_to_trigger_alert = 1
      number_of_evaluation_periods             = 1
    }
  }

  action {
    action_groups = [azurerm_monitor_action_group.critical.id]
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# ============================================================================
# Workbooks
# ============================================================================

resource "random_uuid" "workbook_id" {
}

resource "azurerm_application_insights_workbook" "operations_dashboard" {
  name                = "${random_uuid.workbook_id.result}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  display_name        = "Radio Fleet Operations Dashboard"
  source_id           = azurerm_application_insights.main.id

  data_json = jsonencode({
    version = "Notebook/1.0"
    items = [
      {
        type = 1
        content = {
          json = "# Radio Fleet Dispatch Operations Dashboard"
        }
      }
    ]
  })

  tags = merge(var.tags, {
    Environment = var.environment
  })
}
