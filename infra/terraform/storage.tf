# ============================================================================
# Azure Storage Account
# ============================================================================

resource "azurerm_storage_account" "main" {
  name                     = "ctadprod${var.location_short}sa"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = var.storage_account_tier
  account_replication_type = var.storage_account_replication_type
  account_kind             = "StorageV2"
  min_tls_version          = "TLS1_2"

  # Enable encryption at rest with infrastructure encryption
  infrastructure_encryption_enabled = var.enable_encryption_at_rest

  # Enable HTTPS traffic only
  enable_https_traffic_only = true

  # Allow blob public access (set to false for production)
  allow_nested_items_to_be_public = var.environment != "production"

  # Shared access key access (disable for production with managed identities)
  shared_access_key_enabled = var.environment != "production"

  # Blob properties
  blob_properties {
    # Versioning
    versioning_enabled = true

    # Change feed
    change_feed_enabled           = true
    change_feed_retention_in_days = 7

    # Soft delete for blobs
    delete_retention_policy {
      days = var.environment == "production" ? 30 : 7
    }

    # Soft delete for containers
    container_delete_retention_policy {
      days = var.environment == "production" ? 30 : 7
    }

    # CORS rules for web access
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "HEAD", "POST", "PUT"]
      allowed_origins    = ["*"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
  }

  # Network rules
  network_rules {
    default_action             = var.enable_private_endpoints ? "Deny" : "Allow"
    bypass                     = ["AzureServices"]
    ip_rules                   = var.allowed_ip_ranges
    virtual_network_subnet_ids = [azurerm_subnet.aks.id, azurerm_subnet.data.id]
  }

  tags = merge(var.tags, {
    Environment = var.environment
    Service     = "Storage"
  })
}

# Storage Containers
resource "azurerm_storage_container" "radio_transmissions" {
  name                  = "radio-transmissions"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "transcriptions" {
  name                  = "transcriptions"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "attachments" {
  name                  = "attachments"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "exports" {
  name                  = "exports"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "backups" {
  name                  = "backups"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# Storage Queue for async processing
resource "azurerm_storage_queue" "audio_processing" {
  name                 = "audio-processing"
  storage_account_name = azurerm_storage_account.main.name
}

resource "azurerm_storage_queue" "export_jobs" {
  name                 = "export-jobs"
  storage_account_name = azurerm_storage_account.main.name
}

# Storage Table for metadata
resource "azurerm_storage_table" "transmission_metadata" {
  name                 = "transmissionmetadata"
  storage_account_name = azurerm_storage_account.main.name
}

resource "azurerm_storage_table" "audit_logs" {
  name                 = "auditlogs"
  storage_account_name = azurerm_storage_account.main.name
}

# Lifecycle Management Policy
resource "azurerm_storage_management_policy" "main" {
  storage_account_id = azurerm_storage_account.main.id

  rule {
    name    = "archive-old-transmissions"
    enabled = true

    filters {
      prefix_match = ["radio-transmissions/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than    = 30
        tier_to_archive_after_days_since_modification_greater_than = 90
        delete_after_days_since_modification_greater_than          = 365
      }

      snapshot {
        delete_after_days_since_creation_greater_than = 90
      }
    }
  }

  rule {
    name    = "archive-transcriptions"
    enabled = true

    filters {
      prefix_match = ["transcriptions/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than    = 90
        tier_to_archive_after_days_since_modification_greater_than = 180
        delete_after_days_since_modification_greater_than          = 730
      }
    }
  }

  rule {
    name    = "cleanup-exports"
    enabled = true

    filters {
      prefix_match = ["exports/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        delete_after_days_since_modification_greater_than = 7
      }
    }
  }
}

# Private endpoint for Storage Account
resource "azurerm_private_endpoint" "storage_blob" {
  count               = var.enable_private_endpoints ? 1 : 0
  name                = "${var.project_name}-${var.environment}-blob-pe"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.private_endpoints.id

  private_service_connection {
    name                           = "${var.project_name}-${var.environment}-blob-psc"
    private_connection_resource_id = azurerm_storage_account.main.id
    is_manual_connection           = false
    subresource_names              = ["blob"]
  }

  private_dns_zone_group {
    name                 = "blob-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.storage_blob[0].id]
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

resource "azurerm_private_endpoint" "storage_queue" {
  count               = var.enable_private_endpoints ? 1 : 0
  name                = "${var.project_name}-${var.environment}-queue-pe"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.private_endpoints.id

  private_service_connection {
    name                           = "${var.project_name}-${var.environment}-queue-psc"
    private_connection_resource_id = azurerm_storage_account.main.id
    is_manual_connection           = false
    subresource_names              = ["queue"]
  }

  private_dns_zone_group {
    name                 = "queue-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.storage_queue[0].id]
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# Private DNS Zones for Storage
resource "azurerm_private_dns_zone" "storage_blob" {
  count               = var.enable_private_endpoints ? 1 : 0
  name                = "privatelink.blob.core.windows.net"
  resource_group_name = azurerm_resource_group.main.name

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

resource "azurerm_private_dns_zone_virtual_network_link" "storage_blob" {
  count                 = var.enable_private_endpoints ? 1 : 0
  name                  = "${var.project_name}-${var.environment}-blob-dns-link"
  resource_group_name   = azurerm_resource_group.main.name
  private_dns_zone_name = azurerm_private_dns_zone.storage_blob[0].name
  virtual_network_id    = azurerm_virtual_network.main.id

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

resource "azurerm_private_dns_zone" "storage_queue" {
  count               = var.enable_private_endpoints ? 1 : 0
  name                = "privatelink.queue.core.windows.net"
  resource_group_name = azurerm_resource_group.main.name

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

resource "azurerm_private_dns_zone_virtual_network_link" "storage_queue" {
  count                 = var.enable_private_endpoints ? 1 : 0
  name                  = "${var.project_name}-${var.environment}-queue-dns-link"
  resource_group_name   = azurerm_resource_group.main.name
  private_dns_zone_name = azurerm_private_dns_zone.storage_queue[0].name
  virtual_network_id    = azurerm_virtual_network.main.id

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# Azure Monitor Diagnostic Settings
resource "azurerm_monitor_diagnostic_setting" "storage" {
  name                       = "${var.project_name}-${var.environment}-storage-diag"
  target_resource_id         = "${azurerm_storage_account.main.id}/blobServices/default"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "StorageRead"
  }

  enabled_log {
    category = "StorageWrite"
  }

  enabled_log {
    category = "StorageDelete"
  }

  metric {
    category = "Transaction"
    enabled  = true
  }
}
