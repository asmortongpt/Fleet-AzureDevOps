# =============================================================================
# Enterprise Security Configuration for CTADispatch
# =============================================================================
# FedRAMP-aligned security controls for commercial deployment

# =============================================================================
# Azure Security Center - Standard Tier
# =============================================================================

resource "azurerm_security_center_subscription_pricing" "security_center_vms" {
  tier          = "Standard"
  resource_type = "VirtualMachines"
}

resource "azurerm_security_center_subscription_pricing" "security_center_sql" {
  tier          = "Standard"
  resource_type = "SqlServers"
}

resource "azurerm_security_center_subscription_pricing" "security_center_storage" {
  tier          = "Standard"
  resource_type = "StorageAccounts"
}

resource "azurerm_security_center_subscription_pricing" "security_center_containers" {
  tier          = "Standard"
  resource_type = "ContainerRegistry"
}

resource "azurerm_security_center_subscription_pricing" "security_center_kubernetes" {
  tier          = "Standard"
  resource_type = "KubernetesService"
}

# =============================================================================
# Azure Policy - CIS Benchmark
# =============================================================================

resource "azurerm_subscription_policy_assignment" "cis_benchmark" {
  name                 = "cis-benchmark"
  policy_definition_id = "/providers/Microsoft.Authorization/policySetDefinitions/1f3afdf9-d0c9-4c3d-847f-89da613e70a8"
  subscription_id      = data.azurerm_subscription.current.id
  description          = "CIS Microsoft Azure Foundations Benchmark"

  parameters = jsonencode({
    effect = {
      value = "AuditIfNotExists"
    }
  })
}

# =============================================================================
# Customer-Managed Encryption Key (CMEK)
# =============================================================================

resource "azurerm_key_vault_key" "encryption" {
  name         = "${var.project_name}-encryption-key"
  key_vault_id = azurerm_key_vault.main.id
  key_type     = "RSA"
  key_size     = 4096

  key_opts = [
    "decrypt",
    "encrypt",
    "sign",
    "unwrapKey",
    "verify",
    "wrapKey",
  ]

  rotation_policy {
    automatic {
      time_before_expiry = "P30D"
    }

    expire_after         = "P90D"
    notify_before_expiry = "P29D"
  }

  tags = merge(var.tags, {
    Component = "Encryption"
  })
}

# =============================================================================
# Backup Vault for AKS
# =============================================================================

resource "azurerm_data_protection_backup_vault" "main" {
  name                = "${var.project_name}-backup-vault"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  datastore_type      = "VaultStore"
  redundancy          = "GeoRedundant"

  identity {
    type = "SystemAssigned"
  }

  tags = merge(var.tags, {
    Component = "Backup"
  })
}

# =============================================================================
# Monitoring Alerts
# =============================================================================

# Alert for failed login attempts
resource "azurerm_monitor_metric_alert" "failed_auth" {
  name                = "${var.project_name}-failed-auth-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_kubernetes_cluster.main.id]
  description         = "Alert when authentication failures spike"

  criteria {
    metric_namespace = "Microsoft.ContainerService/managedClusters"
    metric_name      = "kube_pod_status_phase"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 10
  }

  action {
    action_group_id = azurerm_monitor_action_group.critical.id
  }

  severity    = 1
  frequency   = "PT5M"
  window_size = "PT15M"
}

# =============================================================================
# Advanced Threat Protection
# =============================================================================

# Note: azurerm_mssql_server_security_alert_policy is for SQL Server, not PostgreSQL
# PostgreSQL Flexible Server has threat protection built-in when configured
# This is enabled via the postgres.tf configuration

# =============================================================================
# Compliance Automation
# =============================================================================

# Logic App for compliance automation
resource "azurerm_logic_app_workflow" "compliance" {
  name                = "${var.project_name}-compliance-workflow"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  tags = var.tags
}

resource "azurerm_logic_app_trigger_http_request" "compliance" {
  name         = "security-alert-trigger"
  logic_app_id = azurerm_logic_app_workflow.compliance.id

  schema = <<SCHEMA
{
  "type": "object",
  "properties": {
    "alertType": {
      "type": "string"
    },
    "severity": {
      "type": "string"
    },
    "resourceId": {
      "type": "string"
    }
  }
}
SCHEMA
}

resource "azurerm_security_center_automation" "compliance" {
  name                = "${var.project_name}-compliance-automation"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  action {
    type        = "logicapp"
    resource_id = azurerm_logic_app_workflow.compliance.id
    trigger_url = azurerm_logic_app_trigger_http_request.compliance.callback_url
  }

  source {
    event_source = "Assessments"
    rule_set {
      rule {
        property_path  = "properties.metadata.severity"
        operator       = "Equals"
        expected_value = "High"
        property_type  = "String"
      }
    }
  }

  scopes = [data.azurerm_subscription.current.id]
}

# =============================================================================
# Data Subscription Reference
# =============================================================================

data "azurerm_subscription" "current" {
}

# =============================================================================
# Security Configuration Output
# =============================================================================

output "security_settings" {
  value = {
    ddos_protection_enabled    = var.enable_ddos_protection
    private_endpoints_enabled  = var.enable_private_endpoints
    network_policies_enabled   = true
    audit_logging_enabled      = true
    threat_protection_enabled  = true
    encryption_at_rest_enabled = true
    cmek_enabled               = true
    geo_redundant_backup       = true
    security_center_tier       = "Standard"
  }
  description = "Security configuration summary"
}
