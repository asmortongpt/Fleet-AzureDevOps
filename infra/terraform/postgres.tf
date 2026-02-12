# ============================================================================
# Azure PostgreSQL Flexible Server
# ============================================================================

resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "${var.project_name}-${var.environment}-${var.location_short}-psql"
  resource_group_name    = azurerm_resource_group.main.name
  location               = azurerm_resource_group.main.location
  version                = var.postgres_version
  delegated_subnet_id    = var.enable_private_endpoints ? azurerm_subnet.data.id : null
  private_dns_zone_id    = var.enable_private_endpoints ? azurerm_private_dns_zone.postgres[0].id : null
  administrator_login    = var.postgres_admin_username
  administrator_password = random_password.postgres_admin.result
  zone                   = "1"

  storage_mb   = var.postgres_storage_mb
  storage_tier = "P30"

  sku_name   = var.postgres_sku_name
  auto_grow_enabled = true

  backup_retention_days        = var.postgres_backup_retention_days
  geo_redundant_backup_enabled = var.postgres_geo_redundant_backup

  # High availability for production
  dynamic "high_availability" {
    for_each = var.environment == "production" ? [1] : []
    content {
      mode                      = "ZoneRedundant"
      standby_availability_zone = "2"
    }
  }

  # Maintenance window
  maintenance_window {
    day_of_week  = 0 # Sunday
    start_hour   = 2
    start_minute = 0
  }

  tags = merge(var.tags, {
    Environment = var.environment
    Service     = "PostgreSQL"
  })

  depends_on = [
    azurerm_private_dns_zone_virtual_network_link.postgres
  ]
}

# Private DNS Zone for PostgreSQL (if using private endpoints)
resource "azurerm_private_dns_zone" "postgres" {
  count               = var.enable_private_endpoints ? 1 : 0
  name                = "privatelink.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.main.name

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgres" {
  count                 = var.enable_private_endpoints ? 1 : 0
  name                  = "${var.project_name}-${var.environment}-postgres-dns-link"
  resource_group_name   = azurerm_resource_group.main.name
  private_dns_zone_name = azurerm_private_dns_zone.postgres[0].name
  virtual_network_id    = azurerm_virtual_network.main.id

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# PostgreSQL Database
resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = "radio_fleet"
  server_id = azurerm_postgresql_flexible_server.main.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

# PostgreSQL Server Configuration
resource "azurerm_postgresql_flexible_server_configuration" "ssl_enforcement" {
  name      = "require_secure_transport"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "on"
}

resource "azurerm_postgresql_flexible_server_configuration" "log_connections" {
  name      = "log_connections"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "on"
}

resource "azurerm_postgresql_flexible_server_configuration" "log_disconnections" {
  name      = "log_disconnections"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "on"
}

resource "azurerm_postgresql_flexible_server_configuration" "log_checkpoints" {
  name      = "log_checkpoints"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "on"
}

resource "azurerm_postgresql_flexible_server_configuration" "connection_throttling" {
  name      = "connection_throttle.enable"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "on"
}

# Firewall Rules (only if not using private endpoints)
resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure_services" {
  count            = var.enable_private_endpoints ? 0 : 1
  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_aks" {
  count            = var.enable_private_endpoints ? 0 : 1
  name             = "AllowAKSCluster"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = azurerm_public_ip.aks_outbound[0].ip_address
  end_ip_address   = azurerm_public_ip.aks_outbound[0].ip_address
}

# Dynamic firewall rules for allowed IP ranges
resource "azurerm_postgresql_flexible_server_firewall_rule" "allowed_ips" {
  for_each         = var.enable_private_endpoints ? {} : { for idx, range in var.allowed_ip_ranges : idx => range }
  name             = "AllowedIP-${each.key}"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = split("/", each.value)[0]
  end_ip_address   = split("/", each.value)[0]
}

# Azure Monitor Diagnostic Settings
resource "azurerm_monitor_diagnostic_setting" "postgres" {
  name                       = "${var.project_name}-${var.environment}-postgres-diag"
  target_resource_id         = azurerm_postgresql_flexible_server.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "PostgreSQLLogs"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
