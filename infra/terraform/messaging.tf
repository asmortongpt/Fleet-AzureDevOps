# ============================================================================
# Azure Service Bus
# ============================================================================

resource "azurerm_servicebus_namespace" "main" {
  name                = "${var.project_name}-${var.environment}-${var.location_short}-servicebus"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = var.service_bus_sku
  capacity            = var.service_bus_sku == "Premium" ? 1 : 0

  # Zone redundancy for Premium SKU
  zone_redundant = var.service_bus_sku == "Premium" && var.environment == "production"

  # Premium features
  premium_messaging_partitions = var.service_bus_sku == "Premium" ? 1 : 0

  tags = merge(var.tags, {
    Environment = var.environment
    Service     = "Service Bus"
  })
}

# Service Bus Topics
resource "azurerm_servicebus_topic" "radio_transmissions" {
  name         = "radio-transmissions"
  namespace_id = azurerm_servicebus_namespace.main.id

  enable_partitioning = var.service_bus_sku != "Basic"
  max_size_in_megabytes = var.service_bus_sku == "Premium" ? 5120 : 1024

  # Message TTL: 7 days
  default_message_ttl = "P7D"

  # Auto-delete after 7 days of inactivity
  auto_delete_on_idle = "P7D"

  # Duplicate detection window: 10 minutes
  duplicate_detection_history_time_window = "PT10M"
  requires_duplicate_detection = true
}

resource "azurerm_servicebus_topic" "policy_violations" {
  name         = "policy-violations"
  namespace_id = azurerm_servicebus_namespace.main.id

  enable_partitioning = var.service_bus_sku != "Basic"
  max_size_in_megabytes = var.service_bus_sku == "Premium" ? 5120 : 1024

  default_message_ttl = "P30D"
  auto_delete_on_idle = "P30D"
}

resource "azurerm_servicebus_topic" "transcription_results" {
  name         = "transcription-results"
  namespace_id = azurerm_servicebus_namespace.main.id

  enable_partitioning = var.service_bus_sku != "Basic"
  max_size_in_megabytes = var.service_bus_sku == "Premium" ? 5120 : 1024

  default_message_ttl = "P7D"
  auto_delete_on_idle = "P7D"
}

resource "azurerm_servicebus_topic" "nlp_analysis" {
  name         = "nlp-analysis"
  namespace_id = azurerm_servicebus_namespace.main.id

  enable_partitioning = var.service_bus_sku != "Basic"
  max_size_in_megabytes = var.service_bus_sku == "Premium" ? 5120 : 1024

  default_message_ttl = "P7D"
  auto_delete_on_idle = "P7D"
}

# Service Bus Subscriptions
resource "azurerm_servicebus_subscription" "transcription_worker" {
  name               = "transcription-worker"
  topic_id           = azurerm_servicebus_topic.radio_transmissions.id
  max_delivery_count = 10

  # Lock duration for processing
  lock_duration = "PT5M"

  # TTL for messages in subscription
  default_message_ttl = "P7D"
}

resource "azurerm_servicebus_subscription" "nlp_worker" {
  name               = "nlp-worker"
  topic_id           = azurerm_servicebus_topic.transcription_results.id
  max_delivery_count = 10
  lock_duration      = "PT5M"
  default_message_ttl = "P7D"
}

resource "azurerm_servicebus_subscription" "policy_worker" {
  name               = "policy-worker"
  topic_id           = azurerm_servicebus_topic.nlp_analysis.id
  max_delivery_count = 10
  lock_duration      = "PT5M"
  default_message_ttl = "P7D"
}

resource "azurerm_servicebus_subscription" "websocket_notifications" {
  name               = "websocket-notifications"
  topic_id           = azurerm_servicebus_topic.policy_violations.id
  max_delivery_count = 5
  lock_duration      = "PT1M"
  default_message_ttl = "P7D"
}

# Service Bus Queues for dead-letter and retry logic
resource "azurerm_servicebus_queue" "dead_letter" {
  name         = "dead-letter-queue"
  namespace_id = azurerm_servicebus_namespace.main.id

  enable_partitioning = var.service_bus_sku != "Basic"
  max_size_in_megabytes = var.service_bus_sku == "Premium" ? 5120 : 1024

  # Keep dead-letter messages for 30 days
  default_message_ttl = "P30D"

  # Longer lock for investigation
  lock_duration = "PT30M"
}

# Authorization Rules
resource "azurerm_servicebus_namespace_authorization_rule" "send" {
  name         = "send"
  namespace_id = azurerm_servicebus_namespace.main.id

  listen = false
  send   = true
  manage = false
}

resource "azurerm_servicebus_namespace_authorization_rule" "listen" {
  name         = "listen"
  namespace_id = azurerm_servicebus_namespace.main.id

  listen = true
  send   = false
  manage = false
}

# Private endpoint for Service Bus (Premium SKU only)
resource "azurerm_private_endpoint" "servicebus" {
  count               = var.enable_private_endpoints && var.service_bus_sku == "Premium" ? 1 : 0
  name                = "${var.project_name}-${var.environment}-sb-pe"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.private_endpoints.id

  private_service_connection {
    name                           = "${var.project_name}-${var.environment}-sb-psc"
    private_connection_resource_id = azurerm_servicebus_namespace.main.id
    is_manual_connection           = false
    subresource_names              = ["namespace"]
  }

  private_dns_zone_group {
    name                 = "servicebus-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.servicebus[0].id]
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# Private DNS Zone for Service Bus
resource "azurerm_private_dns_zone" "servicebus" {
  count               = var.enable_private_endpoints ? 1 : 0
  name                = "privatelink.servicebus.windows.net"
  resource_group_name = azurerm_resource_group.main.name

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

resource "azurerm_private_dns_zone_virtual_network_link" "servicebus" {
  count                 = var.enable_private_endpoints ? 1 : 0
  name                  = "${var.project_name}-${var.environment}-sb-dns-link"
  resource_group_name   = azurerm_resource_group.main.name
  private_dns_zone_name = azurerm_private_dns_zone.servicebus[0].name
  virtual_network_id    = azurerm_virtual_network.main.id

  tags = merge(var.tags, {
    Environment = var.environment
  })
}

# ============================================================================
# Azure Event Hubs
# ============================================================================

resource "azurerm_eventhub_namespace" "main" {
  name                = "${var.project_name}-${var.environment}-${var.location_short}-eh"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = var.event_hub_sku
  capacity            = var.event_hub_capacity

  # Zone redundancy for Standard and above
  zone_redundant = var.environment == "production"

  # Auto-inflate for Standard SKU
  auto_inflate_enabled     = var.event_hub_sku == "Standard"
  maximum_throughput_units = var.event_hub_sku == "Standard" ? 20 : null

  tags = merge(var.tags, {
    Environment = var.environment
    Service     = "Event Hub"
  })
}

# Event Hubs
resource "azurerm_eventhub" "gps_telemetry" {
  name                = "gps-telemetry"
  namespace_name      = azurerm_eventhub_namespace.main.name
  resource_group_name = azurerm_resource_group.main.name
  partition_count     = 4
  message_retention   = 7
}

resource "azurerm_eventhub" "radio_metadata" {
  name                = "radio-metadata"
  namespace_name      = azurerm_eventhub_namespace.main.name
  resource_group_name = azurerm_resource_group.main.name
  partition_count     = 2
  message_retention   = 7
}

resource "azurerm_eventhub" "system_events" {
  name                = "system-events"
  namespace_name      = azurerm_eventhub_namespace.main.name
  resource_group_name = azurerm_resource_group.main.name
  partition_count     = 2
  message_retention   = 1
}

# Consumer Groups
resource "azurerm_eventhub_consumer_group" "gps_processor" {
  name                = "gps-processor"
  eventhub_name       = azurerm_eventhub.gps_telemetry.name
  namespace_name      = azurerm_eventhub_namespace.main.name
  resource_group_name = azurerm_resource_group.main.name
}

resource "azurerm_eventhub_consumer_group" "radio_processor" {
  name                = "radio-processor"
  eventhub_name       = azurerm_eventhub.radio_metadata.name
  namespace_name      = azurerm_eventhub_namespace.main.name
  resource_group_name = azurerm_resource_group.main.name
}

resource "azurerm_eventhub_consumer_group" "system_monitor" {
  name                = "system-monitor"
  eventhub_name       = azurerm_eventhub.system_events.name
  namespace_name      = azurerm_eventhub_namespace.main.name
  resource_group_name = azurerm_resource_group.main.name
}

# Authorization Rules
resource "azurerm_eventhub_namespace_authorization_rule" "send" {
  name                = "send"
  namespace_name      = azurerm_eventhub_namespace.main.name
  resource_group_name = azurerm_resource_group.main.name

  listen = false
  send   = true
  manage = false
}

resource "azurerm_eventhub_namespace_authorization_rule" "listen" {
  name                = "listen"
  namespace_name      = azurerm_eventhub_namespace.main.name
  resource_group_name = azurerm_resource_group.main.name

  listen = true
  send   = false
  manage = false
}

# Azure Monitor Diagnostic Settings
resource "azurerm_monitor_diagnostic_setting" "servicebus" {
  name                       = "${var.project_name}-${var.environment}-sb-diag"
  target_resource_id         = azurerm_servicebus_namespace.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "OperationalLogs"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

resource "azurerm_monitor_diagnostic_setting" "eventhub" {
  name                       = "${var.project_name}-${var.environment}-eh-diag"
  target_resource_id         = azurerm_eventhub_namespace.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "OperationalLogs"
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}
