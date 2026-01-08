# ============================================================================
# Azure Cache for Redis
# ============================================================================

resource "azurerm_redis_cache" "main" {
  name                = "${var.project_name}-${var.environment}-${var.location_short}-redis"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = var.redis_capacity
  family              = var.redis_family
  sku_name            = var.redis_sku_name
  enable_non_ssl_port = var.redis_enable_non_ssl_port
  minimum_tls_version = "1.2"

  # Security: Disable public network access (use private endpoints)
  public_network_access_enabled = false

  # Redis configuration
  redis_configuration {
    enable_authentication           = true
    maxmemory_reserved              = var.redis_sku_name == "Premium" ? 50 : 2
    maxmemory_delta                 = var.redis_sku_name == "Premium" ? 50 : 2
    maxmemory_policy                = "allkeys-lru"
    notify_keyspace_events          = "Ex"
    rdb_backup_enabled              = var.redis_sku_name == "Premium"
    rdb_backup_frequency            = var.redis_sku_name == "Premium" ? 60 : null
    rdb_storage_connection_string   = var.redis_sku_name == "Premium" ? azurerm_storage_account.main.primary_connection_string : null
    aof_backup_enabled              = var.redis_sku_name == "Premium" && var.environment == "production"
    aof_storage_connection_string_0 = var.redis_sku_name == "Premium" && var.environment == "production" ? azurerm_storage_account.main.primary_connection_string : null
  }

  # Subnet (Premium only)
  subnet_id = var.redis_sku_name == "Premium" && var.enable_private_endpoints ? azurerm_subnet.data.id : null

  # Zone redundancy (Premium only)
  zones = var.redis_sku_name == "Premium" && var.environment == "production" ? ["1", "2"] : null

  # Patch schedule
  dynamic "patch_schedule" {
    for_each = var.redis_sku_name == "Premium" || var.redis_sku_name == "Standard" ? [1] : []
    content {
      day_of_week    = "Sunday"
      start_hour_utc = 2
    }
  }

  tags = merge(var.tags, {
    Environment = var.environment
    Service     = "Redis Cache"
  })

  depends_on = [
    azurerm_subnet.data
  ]
}

# Private endpoint for Redis (if enabled)
resource "azurerm_private_endpoint" "redis" {
  count               = var.enable_private_endpoints && var.redis_sku_name == "Premium" ? 1 : 0
  name                = "${var.project_name}-${var.environment}-redis-pe"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.private_endpoints.id

  private_service_connection {
    name                           = "${var.project_name}-${var.environment}-redis-psc"
    private_connection_resource_id = azurerm_redis_cache.main.id
    is_manual_connection           = false
    subresource_names              = ["redisCache"]
  }

  private_dns_zone_group {
    name                 = "redis-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.redis[0].id]
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# Private DNS Zone for Redis (if using private endpoints)
resource "azurerm_private_dns_zone" "redis" {
  count               = var.enable_private_endpoints ? 1 : 0
  name                = "privatelink.redis.cache.windows.net"
  resource_group_name = azurerm_resource_group.main.name

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

resource "azurerm_private_dns_zone_virtual_network_link" "redis" {
  count                 = var.enable_private_endpoints ? 1 : 0
  name                  = "${var.project_name}-${var.environment}-redis-dns-link"
  resource_group_name   = azurerm_resource_group.main.name
  private_dns_zone_name = azurerm_private_dns_zone.redis[0].name
  virtual_network_id    = azurerm_virtual_network.main.id

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# Azure Monitor Diagnostic Settings
resource "azurerm_monitor_diagnostic_setting" "redis" {
  name                       = "${var.project_name}-${var.environment}-redis-diag"
  target_resource_id         = azurerm_redis_cache.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "ConnectedClientList"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
