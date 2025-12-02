# Fleet Management System - AI Agents Orchestration
# 10 Specialized Azure OpenAI Agents for Production Enhancement

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

# Azure OpenAI Service for AI Agents
resource "azurerm_cognitive_account" "openai" {
  name                = "${var.resource_prefix}-${var.environment}-openai"
  location            = "eastus"  # OpenAI available in specific regions
  resource_group_name = azurerm_resource_group.main.name
  kind                = "OpenAI"
  sku_name            = "S0"

  tags = merge(azurerm_resource_group.main.tags, {
    Purpose = "AI-Agents-Orchestration"
  })
}

# Deploy GPT-4 model for intelligent agents
resource "azurerm_cognitive_deployment" "gpt4" {
  name                 = "gpt-4-agents"
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = "gpt-4"
    version = "0613"
  }

  scale {
    type     = "Standard"
    capacity = 100  # High capacity for 10 concurrent agents
  }
}

# Agent Orchestrator Container Instance
resource "azurerm_container_group" "agent_orchestrator" {
  name                = "${var.resource_prefix}-agent-orchestrator"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  ip_address_type     = "Private"
  subnet_ids          = [azurerm_subnet.aks.id]
  os_type             = "Linux"

  container {
    name   = "orchestrator"
    image  = "${azurerm_container_registry.main.login_server}/fleet/ai-orchestrator:latest"
    cpu    = "4"
    memory = "16"

    ports {
      port     = 8080
      protocol = "TCP"
    }

    environment_variables = {
      AZURE_OPENAI_ENDPOINT = azurerm_cognitive_account.openai.endpoint
      AGENT_COUNT           = "10"
      ORCHESTRATION_MODE    = "autonomous"
      DATABASE_URL          = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.database_url.id})"
      REDIS_URL             = "@Microsoft.KeyVault(SecretUri=${azurerm_key_vault_secret.redis_url.id})"
    }

    secure_environment_variables = {
      AZURE_OPENAI_KEY = azurerm_cognitive_account.openai.primary_access_key
    }

    volume {
      name       = "agent-logs"
      mount_path = "/var/log/agents"
      storage_account_name = azurerm_storage_account.main.name
      storage_account_key  = azurerm_storage_account.main.primary_access_key
      share_name           = azurerm_storage_share.agent_logs.name
    }
  }

  tags = azurerm_resource_group.main.tags
}

# Storage for agent logs and outputs
resource "azurerm_storage_share" "agent_logs" {
  name                 = "agent-logs"
  storage_account_name = azurerm_storage_account.main.name
  quota                = 100  # 100 GB
}

# Azure Logic App for Agent Task Scheduling
resource "azurerm_logic_app_workflow" "agent_scheduler" {
  name                = "${var.resource_prefix}-agent-scheduler"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  tags = azurerm_resource_group.main.tags
}

# Cosmos DB for Agent State Management
resource "azurerm_cosmosdb_account" "agent_state" {
  name                = "${var.resource_prefix}-agent-state"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = azurerm_resource_group.main.location
    failover_priority = 0
  }

  capabilities {
    name = "EnableServerless"
  }

  tags = azurerm_resource_group.main.tags
}

resource "azurerm_cosmosdb_sql_database" "agents" {
  name                = "agent-orchestration"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.agent_state.name
}

resource "azurerm_cosmosdb_sql_container" "agent_tasks" {
  name                = "tasks"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.agent_state.name
  database_name       = azurerm_cosmosdb_sql_database.agents.name
  partition_key_path  = "/agentId"
  throughput          = 400
}

resource "azurerm_cosmosdb_sql_container" "agent_results" {
  name                = "results"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.agent_state.name
  database_name       = azurerm_cosmosdb_sql_database.agents.name
  partition_key_path  = "/taskId"
  throughput          = 400
}

# Service Bus for Agent Communication
resource "azurerm_servicebus_namespace" "agents" {
  name                = "${var.resource_prefix}-agents-sb"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "Premium"
  capacity            = 1

  tags = azurerm_resource_group.main.tags
}

# Queue for each specialized agent
resource "azurerm_servicebus_queue" "agent_queues" {
  for_each = toset([
    "predictive-maintenance-agent",
    "route-optimization-agent",
    "compliance-reporting-agent",
    "video-analysis-agent",
    "cost-optimization-agent",
    "safety-monitoring-agent",
    "inventory-management-agent",
    "driver-coaching-agent",
    "fuel-efficiency-agent",
    "integration-agent"
  ])

  name         = each.key
  namespace_id = azurerm_servicebus_namespace.agents.id

  max_delivery_count            = 3
  dead_lettering_on_message_expiration = true
  default_message_ttl           = "PT24H"
  lock_duration                 = "PT5M"
  requires_session              = true
}

# Outputs
output "openai_endpoint" {
  value = azurerm_cognitive_account.openai.endpoint
}

output "agent_orchestrator_ip" {
  value = azurerm_container_group.agent_orchestrator.ip_address
}

output "cosmosdb_endpoint" {
  value = azurerm_cosmosdb_account.agent_state.endpoint
}

output "servicebus_connection_string" {
  value     = azurerm_servicebus_namespace.agents.default_primary_connection_string
  sensitive = true
}
