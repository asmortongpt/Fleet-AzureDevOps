variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "radio-fleet"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus"
}

variable "location_short" {
  description = "Short Azure region code for naming"
  type        = string
  default     = "eus"
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "Radio Fleet Dispatch"
    ManagedBy   = "Terraform"
    CostCenter  = "Engineering"
    Compliance  = "FedRAMP"
  }
}

# Network Configuration
variable "vnet_address_space" {
  description = "Address space for the virtual network"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "aks_subnet_address_prefix" {
  description = "Address prefix for AKS subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "data_subnet_address_prefix" {
  description = "Address prefix for data services subnet"
  type        = string
  default     = "10.0.2.0/24"
}

variable "private_endpoint_subnet_address_prefix" {
  description = "Address prefix for private endpoints subnet"
  type        = string
  default     = "10.0.3.0/24"
}

# AKS Configuration
variable "aks_node_count" {
  description = "Initial number of nodes in the AKS cluster"
  type        = number
  default     = 2
}

variable "aks_node_vm_size" {
  description = "VM size for AKS nodes"
  type        = string
  default     = "Standard_D4s_v3"
}

variable "aks_min_node_count" {
  description = "Minimum number of nodes for autoscaling"
  type        = number
  default     = 2
}

variable "aks_max_node_count" {
  description = "Maximum number of nodes for autoscaling"
  type        = number
  default     = 10
}

variable "kubernetes_version" {
  description = "Kubernetes version for AKS"
  type        = string
  default     = "1.28"
}

# Database Configuration
variable "postgres_sku_name" {
  description = "SKU name for PostgreSQL Flexible Server"
  type        = string
  default     = "GP_Standard_D2ds_v4"
}

variable "postgres_storage_mb" {
  description = "Storage size in MB for PostgreSQL"
  type        = number
  default     = 32768
}

variable "postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "16"
}

variable "postgres_backup_retention_days" {
  description = "Backup retention in days for PostgreSQL"
  type        = number
  default     = 35
}

variable "postgres_geo_redundant_backup" {
  description = "Enable geo-redundant backups for PostgreSQL"
  type        = bool
  default     = true
}

variable "postgres_admin_username" {
  description = "Admin username for PostgreSQL"
  type        = string
  default     = "pgadmin"
  sensitive   = true
}

# Redis Configuration
variable "redis_sku_name" {
  description = "SKU name for Redis Cache"
  type        = string
  default     = "Standard"
}

variable "redis_family" {
  description = "SKU family for Redis Cache"
  type        = string
  default     = "C"
}

variable "redis_capacity" {
  description = "Capacity for Redis Cache"
  type        = number
  default     = 1
}

variable "redis_enable_non_ssl_port" {
  description = "Enable non-SSL port for Redis"
  type        = bool
  default     = false
}

# Service Bus Configuration
variable "service_bus_sku" {
  description = "SKU for Service Bus namespace"
  type        = string
  default     = "Standard"
}

# Event Hub Configuration
variable "event_hub_sku" {
  description = "SKU for Event Hub namespace"
  type        = string
  default     = "Standard"
}

variable "event_hub_capacity" {
  description = "Throughput units for Event Hub"
  type        = number
  default     = 2
}

# Storage Configuration
variable "storage_account_tier" {
  description = "Tier for Storage Account"
  type        = string
  default     = "Standard"
}

variable "storage_account_replication_type" {
  description = "Replication type for Storage Account"
  type        = string
  default     = "GRS"
}

# Key Vault Configuration
variable "key_vault_sku" {
  description = "SKU for Key Vault"
  type        = string
  default     = "standard"
}

variable "key_vault_soft_delete_retention_days" {
  description = "Soft delete retention days for Key Vault"
  type        = number
  default     = 90
}

# Allowed IP ranges for network security
variable "allowed_ip_ranges" {
  description = "IP ranges allowed to access services"
  type        = list(string)
  default     = []
}

# Feature flags
variable "enable_private_endpoints" {
  description = "Enable private endpoints for data services"
  type        = bool
  default     = false
}

variable "enable_encryption_at_rest" {
  description = "Enable encryption at rest with customer-managed keys"
  type        = bool
  default     = true
}

variable "enable_ddos_protection" {
  description = "Enable DDoS protection for VNet"
  type        = bool
  default     = false
}

variable "enable_network_policy" {
  description = "Enable network policy (Calico/Azure) in AKS"
  type        = bool
  default     = true
}
