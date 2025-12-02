# Variables for CTAFleet Terraform Configuration

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be production, staging, or development."
  }
}

variable "location" {
  description = "Azure region for primary deployment"
  type        = string
  default     = "eastus2"
}

variable "dr_location" {
  description = "Azure region for disaster recovery"
  type        = string
  default     = "westus2"
}

variable "cost_center" {
  description = "Cost center for resource tagging"
  type        = string
  default     = "Engineering"
}

variable "allowed_ip_ranges" {
  description = "IP ranges allowed to access resources"
  type        = string
  default     = "0.0.0.0/0"
}

variable "allowed_storage_ips" {
  description = "List of IP ranges allowed to access Storage Account"
  type        = list(string)
  default     = []
}

variable "allowed_keyvault_ips" {
  description = "List of IP ranges allowed to access Key Vault"
  type        = list(string)
  default     = []
}

variable "aks_authorized_ip_ranges" {
  description = "List of IP ranges authorized to access AKS API server"
  type        = list(string)
  default     = []

  validation {
    condition     = length(var.aks_authorized_ip_ranges) > 0
    error_message = "AKS API server must have authorized IP ranges defined for security. Add your office/CI/CD IPs."
  }
}

variable "aks_admin_group_ids" {
  description = "List of Azure AD group object IDs for AKS cluster admins"
  type        = list(string)
  default     = []

  validation {
    condition     = length(var.aks_admin_group_ids) > 0
    error_message = "At least one Azure AD admin group must be specified for AKS RBAC."
  }
}

# AKS Configuration
variable "kubernetes_version" {
  description = "Kubernetes version for AKS cluster"
  type        = string
  default     = "1.28.3"
}

variable "aks_node_count" {
  description = "Initial number of nodes in AKS cluster"
  type        = number
  default     = 3
}

variable "aks_min_nodes" {
  description = "Minimum number of nodes for autoscaling"
  type        = number
  default     = 3
}

variable "aks_max_nodes" {
  description = "Maximum number of nodes for autoscaling"
  type        = number
  default     = 10
}

variable "aks_vm_size" {
  description = "VM size for AKS nodes"
  type        = string
  default     = "Standard_D4s_v3"
}

# PostgreSQL Configuration
variable "postgres_sku" {
  description = "SKU for PostgreSQL Flexible Server"
  type        = string
  default     = "GP_Standard_D4s_v3"
}

variable "postgres_storage_mb" {
  description = "Storage size in MB for PostgreSQL"
  type        = number
  default     = 131072  # 128 GB
}

variable "postgres_admin_username" {
  description = "Administrator username for PostgreSQL"
  type        = string
  default     = "fleetadmin"
  sensitive   = true
}

variable "postgres_admin_password" {
  description = "Administrator password for PostgreSQL"
  type        = string
  sensitive   = true
}

# Redis Configuration
variable "redis_capacity" {
  description = "Capacity of Redis cache"
  type        = number
  default     = 1
}

variable "redis_family" {
  description = "Redis cache family"
  type        = string
  default     = "P"
}

variable "redis_sku" {
  description = "Redis cache SKU"
  type        = string
  default     = "Premium"
}
