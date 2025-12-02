# Fleet Management System - Azure Infrastructure
# Production-Ready Terraform Configuration

terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.0"
    }
  }

  backend "azurerm" {
    resource_group_name  = "fleet-terraform-state"
    storage_account_name = "fleetterraformstate"
    container_name       = "tfstate"
    key                  = "production.terraform.tfstate"
  }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy = false
    }
  }
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus2"
}

variable "resource_prefix" {
  description = "Prefix for resource names"
  type        = string
  default     = "fleet"
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "${var.resource_prefix}-${var.environment}-rg"
  location = var.location

  tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Project     = "FleetManagement"
  }
}

# Virtual Network
resource "azurerm_virtual_network" "main" {
  name                = "${var.resource_prefix}-${var.environment}-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  tags = azurerm_resource_group.main.tags
}

# Subnets
resource "azurerm_subnet" "aks" {
  name                 = "aks-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_subnet" "database" {
  name                 = "database-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.2.0/24"]

  delegation {
    name = "postgresql-delegation"
    service_delegation {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action",
      ]
    }
  }
}

# Azure Kubernetes Service (AKS)
resource "azurerm_kubernetes_cluster" "main" {
  name                = "${var.resource_prefix}-${var.environment}-aks"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = "${var.resource_prefix}-${var.environment}"
  kubernetes_version  = "1.28"

  default_node_pool {
    name                = "system"
    node_count          = 3
    vm_size             = "Standard_D4s_v3"
    vnet_subnet_id      = azurerm_subnet.aks.id
    enable_auto_scaling = true
    min_count           = 3
    max_count           = 10

    tags = azurerm_resource_group.main.tags
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin     = "azure"
    network_policy     = "calico"
    service_cidr       = "10.1.0.0/16"
    dns_service_ip     = "10.1.0.10"
    docker_bridge_cidr = "172.17.0.1/16"
  }

  azure_active_directory_role_based_access_control {
    managed                = true
    azure_rbac_enabled     = true
  }

  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }

  tags = azurerm_resource_group.main.tags
}

# Additional Node Pool for AI/ML workloads
resource "azurerm_kubernetes_cluster_node_pool" "ai" {
  name                  = "ai"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = "Standard_NC6s_v3" # GPU-enabled
  node_count            = 2
  enable_auto_scaling   = true
  min_count             = 1
  max_count             = 5

  node_labels = {
    workload = "ai-ml"
  }

  tags = azurerm_resource_group.main.tags
}

# PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "${var.resource_prefix}-${var.environment}-psql"
  resource_group_name    = azurerm_resource_group.main.name
  location               = azurerm_resource_group.main.location
  version                = "15"
  administrator_login    = "fleetadmin"
  administrator_password = random_password.postgres.result

  storage_mb   = 131072 # 128GB
  sku_name     = "GP_Standard_D4s_v3"

  delegated_subnet_id = azurerm_subnet.database.id
  private_dns_zone_id = azurerm_private_dns_zone.postgres.id

  backup_retention_days        = 35
  geo_redundant_backup_enabled = true

  high_availability {
    mode                      = "ZoneRedundant"
    standby_availability_zone = "2"
  }

  tags = azurerm_resource_group.main.tags

  depends_on = [azurerm_private_dns_zone_virtual_network_link.postgres]
}

resource "azurerm_postgresql_flexible_server_database" "fleet" {
  name      = "fleet_production"
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Private DNS Zone for PostgreSQL
resource "azurerm_private_dns_zone" "postgres" {
  name                = "privatelink.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.main.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "postgres" {
  name                  = "postgres-vnet-link"
  resource_group_name   = azurerm_resource_group.main.name
  private_dns_zone_name = azurerm_private_dns_zone.postgres.name
  virtual_network_id    = azurerm_virtual_network.main.id
}

# Azure Cache for Redis
resource "azurerm_redis_cache" "main" {
  name                = "${var.resource_prefix}-${var.environment}-redis"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = 2
  family              = "P" # Premium
  sku_name            = "Premium"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"

  redis_configuration {
    maxmemory_policy = "allkeys-lru"
  }

  tags = azurerm_resource_group.main.tags
}

# Azure Key Vault
resource "azurerm_key_vault" "main" {
  name                       = "${var.resource_prefix}-${var.environment}-kv"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "premium"
  soft_delete_retention_days = 90
  purge_protection_enabled   = true

  network_acls {
    default_action = "Deny"
    bypass         = "AzureServices"
    virtual_network_subnet_ids = [azurerm_subnet.aks.id]
  }

  tags = azurerm_resource_group.main.tags
}

# Grant AKS access to Key Vault
resource "azurerm_key_vault_access_policy" "aks" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_kubernetes_cluster.main.identity[0].principal_id

  secret_permissions = [
    "Get",
    "List"
  ]
}

# Storage Account for Videos and Documents
resource "azurerm_storage_account" "main" {
  name                     = "${var.resource_prefix}${var.environment}storage"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "GRS"
  account_kind             = "StorageV2"

  blob_properties {
    versioning_enabled = true

    delete_retention_policy {
      days = 30
    }
  }

  tags = azurerm_resource_group.main.tags
}

resource "azurerm_storage_container" "videos" {
  name                  = "videos"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "documents" {
  name                  = "documents"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# Azure Container Registry
resource "azurerm_container_registry" "main" {
  name                = "${var.resource_prefix}${var.environment}acr"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Premium"
  admin_enabled       = false

  georeplications {
    location = "westus2"
    zone_redundancy_enabled = true
  }

  tags = azurerm_resource_group.main.tags
}

# Grant AKS pull access to ACR
resource "azurerm_role_assignment" "aks_acr" {
  principal_id                     = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
  role_definition_name             = "AcrPull"
  scope                            = azurerm_container_registry.main.id
  skip_service_principal_aad_check = true
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "${var.resource_prefix}-${var.environment}-appinsights"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  application_type    = "web"

  tags = azurerm_resource_group.main.tags
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.resource_prefix}-${var.environment}-law"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 90

  tags = azurerm_resource_group.main.tags
}

# Azure Front Door (CDN + WAF)
resource "azurerm_cdn_frontdoor_profile" "main" {
  name                = "${var.resource_prefix}-${var.environment}-afd"
  resource_group_name = azurerm_resource_group.main.name
  sku_name            = "Premium_AzureFrontDoor"

  tags = azurerm_resource_group.main.tags
}

# Secrets
resource "random_password" "postgres" {
  length  = 32
  special = true
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "azurerm_key_vault_secret" "postgres_password" {
  name         = "postgres-admin-password"
  value        = random_password.postgres.result
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_key_vault_access_policy.aks]
}

resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "jwt-secret"
  value        = random_password.jwt_secret.result
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_key_vault_access_policy.aks]
}

# Data sources
data "azurerm_client_config" "current" {}

# Outputs
output "aks_cluster_name" {
  value = azurerm_kubernetes_cluster.main.name
}

output "acr_login_server" {
  value = azurerm_container_registry.main.login_server
}

output "postgres_fqdn" {
  value = azurerm_postgresql_flexible_server.main.fqdn
}

output "redis_hostname" {
  value = azurerm_redis_cache.main.hostname
}

output "storage_account_name" {
  value = azurerm_storage_account.main.name
}

output "key_vault_uri" {
  value = azurerm_key_vault.main.vault_uri
}

output "application_insights_connection_string" {
  value     = azurerm_application_insights.main.connection_string
  sensitive = true
}
