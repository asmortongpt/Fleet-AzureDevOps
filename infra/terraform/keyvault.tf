# ============================================================================
# Get current Azure client configuration
# ============================================================================
data "azurerm_client_config" "current" {}

# ============================================================================
# Azure Key Vault
# ============================================================================

resource "azurerm_key_vault" "main" {
  name                        = "ctad-prod-${var.location_short}-kv"
  location                    = azurerm_resource_group.main.location
  resource_group_name         = azurerm_resource_group.main.name
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  sku_name                    = var.key_vault_sku
  soft_delete_retention_days  = var.key_vault_soft_delete_retention_days
  purge_protection_enabled    = var.environment == "production"
  enable_rbac_authorization   = true

  # Network ACLs
  network_acls {
    bypass                     = "AzureServices"
    default_action             = var.enable_private_endpoints ? "Deny" : "Allow"
    ip_rules                   = var.allowed_ip_ranges
    virtual_network_subnet_ids = [azurerm_subnet.aks.id, azurerm_subnet.data.id]
  }

  tags = merge(var.tags, {
    Environment = var.environment
    Service     = "Key Vault"
  })
}

# Private endpoint for Key Vault
resource "azurerm_private_endpoint" "keyvault" {
  count               = var.enable_private_endpoints ? 1 : 0
  name                = "${var.project_name}-${var.environment}-kv-pe"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.private_endpoints.id

  private_service_connection {
    name                           = "${var.project_name}-${var.environment}-kv-psc"
    private_connection_resource_id = azurerm_key_vault.main.id
    is_manual_connection           = false
    subresource_names              = ["vault"]
  }

  private_dns_zone_group {
    name                 = "keyvault-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.keyvault[0].id]
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# Private DNS Zone for Key Vault
resource "azurerm_private_dns_zone" "keyvault" {
  count               = var.enable_private_endpoints ? 1 : 0
  name                = "privatelink.vaultcore.azure.net"
  resource_group_name = azurerm_resource_group.main.name

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

resource "azurerm_private_dns_zone_virtual_network_link" "keyvault" {
  count                 = var.enable_private_endpoints ? 1 : 0
  name                  = "${var.project_name}-${var.environment}-kv-dns-link"
  resource_group_name   = azurerm_resource_group.main.name
  private_dns_zone_name = azurerm_private_dns_zone.keyvault[0].name
  virtual_network_id    = azurerm_virtual_network.main.id

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# ============================================================================
# Key Vault Role Assignments
# ============================================================================

# Grant current user/service principal admin access
resource "azurerm_role_assignment" "keyvault_admin" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Administrator"
  principal_id         = data.azurerm_client_config.current.object_id
}

# Grant AKS cluster access to secrets
resource "azurerm_role_assignment" "aks_keyvault_secrets_user" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_kubernetes_cluster.main.key_vault_secrets_provider[0].secret_identity[0].object_id

  depends_on = [
    azurerm_role_assignment.keyvault_admin
  ]
}

# ============================================================================
# Key Vault Secrets
# ============================================================================

# PostgreSQL connection string
resource "azurerm_key_vault_secret" "postgres_connection_string" {
  name         = "postgres-connection-string"
  value        = "postgresql://${var.postgres_admin_username}:${random_password.postgres_admin.result}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.main.name}?sslmode=require"
  key_vault_id = azurerm_key_vault.main.id

  # Security: Add expiration date (1 year from creation)
  expiration_date = timeadd(timestamp(), "8760h")

  # Security: Specify content type for better secret management
  content_type = "connection-string"

  depends_on = [
    azurerm_role_assignment.keyvault_admin
  ]

  lifecycle {
    ignore_changes = [expiration_date]
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# PostgreSQL admin password
resource "azurerm_key_vault_secret" "postgres_admin_password" {
  name         = "postgres-admin-password"
  value        = random_password.postgres_admin.result
  key_vault_id = azurerm_key_vault.main.id

  # Security: Add expiration date (1 year from creation)
  expiration_date = timeadd(timestamp(), "8760h")

  # Security: Specify content type for better secret management
  content_type = "password"

  depends_on = [
    azurerm_role_assignment.keyvault_admin
  ]

  lifecycle {
    ignore_changes = [expiration_date]
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# Redis connection string
resource "azurerm_key_vault_secret" "redis_connection_string" {
  name         = "redis-connection-string"
  value        = "rediss://:${azurerm_redis_cache.main.primary_access_key}@${azurerm_redis_cache.main.hostname}:${azurerm_redis_cache.main.ssl_port}/0"
  key_vault_id = azurerm_key_vault.main.id

  # Security: Add expiration date (1 year from creation)
  expiration_date = timeadd(timestamp(), "8760h")

  # Security: Specify content type for better secret management
  content_type = "connection-string"

  depends_on = [
    azurerm_role_assignment.keyvault_admin
  ]

  lifecycle {
    ignore_changes = [expiration_date]
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# Redis primary key
resource "azurerm_key_vault_secret" "redis_primary_key" {
  name         = "redis-primary-key"
  value        = azurerm_redis_cache.main.primary_access_key
  key_vault_id = azurerm_key_vault.main.id

  # Security: Add expiration date (1 year from creation)
  expiration_date = timeadd(timestamp(), "8760h")

  # Security: Specify content type for better secret management
  content_type = "api-key"

  depends_on = [
    azurerm_role_assignment.keyvault_admin
  ]

  lifecycle {
    ignore_changes = [expiration_date]
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# Service Bus connection string
resource "azurerm_key_vault_secret" "servicebus_connection_string" {
  name         = "servicebus-connection-string"
  value        = azurerm_servicebus_namespace.main.default_primary_connection_string
  key_vault_id = azurerm_key_vault.main.id

  # Security: Add expiration date (1 year from creation)
  expiration_date = timeadd(timestamp(), "8760h")

  # Security: Specify content type for better secret management
  content_type = "connection-string"

  depends_on = [
    azurerm_role_assignment.keyvault_admin
  ]

  lifecycle {
    ignore_changes = [expiration_date]
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# Event Hub connection string
resource "azurerm_key_vault_secret" "eventhub_connection_string" {
  name         = "eventhub-connection-string"
  value        = azurerm_eventhub_namespace.main.default_primary_connection_string
  key_vault_id = azurerm_key_vault.main.id

  # Security: Add expiration date (1 year from creation)
  expiration_date = timeadd(timestamp(), "8760h")

  # Security: Specify content type for better secret management
  content_type = "connection-string"

  depends_on = [
    azurerm_role_assignment.keyvault_admin
  ]

  lifecycle {
    ignore_changes = [expiration_date]
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# Storage Account connection string
resource "azurerm_key_vault_secret" "storage_connection_string" {
  name         = "storage-connection-string"
  value        = azurerm_storage_account.main.primary_connection_string
  key_vault_id = azurerm_key_vault.main.id

  # Security: Add expiration date (1 year from creation)
  expiration_date = timeadd(timestamp(), "8760h")

  # Security: Specify content type for better secret management
  content_type = "connection-string"

  depends_on = [
    azurerm_role_assignment.keyvault_admin
  ]

  lifecycle {
    ignore_changes = [expiration_date]
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# Application Insights connection string
resource "azurerm_key_vault_secret" "appinsights_connection_string" {
  name         = "appinsights-connection-string"
  value        = azurerm_application_insights.main.connection_string
  key_vault_id = azurerm_key_vault.main.id

  # Security: Add expiration date (1 year from creation)
  expiration_date = timeadd(timestamp(), "8760h")

  # Security: Specify content type for better secret management
  content_type = "connection-string"

  depends_on = [
    azurerm_role_assignment.keyvault_admin
  ]

  lifecycle {
    ignore_changes = [expiration_date]
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# Application Insights instrumentation key
resource "azurerm_key_vault_secret" "appinsights_instrumentation_key" {
  name         = "appinsights-instrumentation-key"
  value        = azurerm_application_insights.main.instrumentation_key
  key_vault_id = azurerm_key_vault.main.id

  # Security: Add expiration date (1 year from creation)
  expiration_date = timeadd(timestamp(), "8760h")

  # Security: Specify content type for better secret management
  content_type = "api-key"

  depends_on = [
    azurerm_role_assignment.keyvault_admin
  ]

  lifecycle {
    ignore_changes = [expiration_date]
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# Placeholder secrets for OIDC (to be updated manually)
resource "azurerm_key_vault_secret" "oidc_client_secret" {
  name         = "oidc-client-secret"
  value        = "PLACEHOLDER-UPDATE-IN-AZURE-PORTAL"
  key_vault_id = azurerm_key_vault.main.id

  # Security: Add expiration date (1 year from creation)
  expiration_date = timeadd(timestamp(), "8760h")

  # Security: Specify content type for better secret management
  content_type = "client-secret"

  depends_on = [
    azurerm_role_assignment.keyvault_admin
  ]

  lifecycle {
    ignore_changes = [expiration_date, value] # Don't overwrite manual updates
  }

  tags = merge(var.tags, {
    Environment = var.environment
    Note        = "Update this secret in Azure Portal"
  })

  lifecycle {
    ignore_changes = [value]
  }
}

resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "jwt-secret"
  value        = "PLACEHOLDER-UPDATE-IN-AZURE-PORTAL"
  key_vault_id = azurerm_key_vault.main.id

  # Security: Add expiration date (1 year from creation)
  expiration_date = timeadd(timestamp(), "8760h")

  # Security: Specify content type for better secret management
  content_type = "secret-key"

  depends_on = [
    azurerm_role_assignment.keyvault_admin
  ]

  lifecycle {
    ignore_changes = [expiration_date, value] # Don't overwrite manual updates
  }

  tags = merge(var.tags, {
    Environment = var.environment
    Note        = "Update this secret in Azure Portal"
  })
}

# Azure Monitor Diagnostic Settings
resource "azurerm_monitor_diagnostic_setting" "keyvault" {
  name                       = "${var.project_name}-${var.environment}-kv-diag"
  target_resource_id         = azurerm_key_vault.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "AuditEvent"
  }

  enabled_log {
    category = "AzurePolicyEvaluationDetails"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
