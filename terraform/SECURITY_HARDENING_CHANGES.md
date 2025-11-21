# Azure Infrastructure Security Hardening Changes

## Overview
This document describes the security hardening changes applied to the CTAFleet Terraform configuration to address critical and medium severity security issues.

## Security Issues Addressed

### 1. Azure Storage Account Security (HIGH)
**Issue**: Storage account allows public blob access and doesn't enforce minimum TLS version

**Changes Required in `main.tf` - azurerm_storage_account resource (line ~265)**:

```hcl
resource "azurerm_storage_account" "main" {
  name                     = "ctafleet${local.environment}storage"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "GRS"
  account_kind             = "StorageV2"

  # ADD THESE SECURITY SETTINGS:
  allow_blob_public_access  = false              # Disable public blob access
  min_tls_version           = "TLS1_2"           # Enforce TLS 1.2 minimum
  enable_https_traffic_only = true               # HTTPS-only traffic

  blob_properties {
    versioning_enabled       = true
    change_feed_enabled      = true
    last_access_time_enabled = true

    delete_retention_policy {
      days = 30
    }

    container_delete_retention_policy {
      days = 30
    }
  }

  network_rules {
    default_action             = "Deny"
    bypass                     = ["AzureServices"]
    virtual_network_subnet_ids = [azurerm_subnet.aks.id]
    ip_rules                   = var.allowed_storage_ips  # ADD THIS LINE
  }

  tags = local.common_tags
}
```

### 2. Azure Key Vault Security (MEDIUM)
**Issue**: Key Vault allows public network access

**Changes Required in `main.tf` - azurerm_key_vault resource (line ~310)**:

```hcl
resource "azurerm_key_vault" "main" {
  name                       = "ctafleet-${local.environment}-kv"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "premium"
  soft_delete_retention_days = 90
  purge_protection_enabled   = true

  # ADD THIS SECURITY SETTING:
  public_network_access_enabled = false          # Disable public access

  network_acls {
    default_action             = "Deny"
    bypass                     = "AzureServices"
    virtual_network_subnet_ids = [azurerm_subnet.aks.id]
    ip_rules                   = var.allowed_keyvault_ips  # ADD THIS LINE
  }

  tags = local.common_tags
}
```

**ADD these Private Endpoint resources after the Key Vault**:

```hcl
# Private Endpoint Subnet for Key Vault
resource "azurerm_subnet" "private_endpoints" {
  name                 = "private-endpoints-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.4.0/24"]
}

# Private DNS Zone for Key Vault
resource "azurerm_private_dns_zone" "keyvault" {
  name                = "privatelink.vaultcore.azure.net"
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.common_tags
}

# Link Private DNS Zone to VNet
resource "azurerm_private_dns_zone_virtual_network_link" "keyvault" {
  name                  = "keyvault-dns-link"
  resource_group_name   = azurerm_resource_group.main.name
  private_dns_zone_name = azurerm_private_dns_zone.keyvault.name
  virtual_network_id    = azurerm_virtual_network.main.id
  tags                  = local.common_tags
}

# Private Endpoint for Key Vault
resource "azurerm_private_endpoint" "keyvault" {
  name                = "ctafleet-${local.environment}-kv-pe"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.private_endpoints.id

  private_service_connection {
    name                           = "keyvault-privateserviceconnection"
    private_connection_resource_id = azurerm_key_vault.main.id
    subresource_names              = ["vault"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "keyvault-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.keyvault.id]
  }

  tags = local.common_tags
}
```

### 3. AKS Cluster Security (HIGH)
**Issue**: AKS cluster lacks auto-upgrades, local accounts enabled, no API server restrictions, no Azure AD integration

**Changes Required in `main.tf` - azurerm_kubernetes_cluster resource (line ~155)**:

```hcl
resource "azurerm_kubernetes_cluster" "main" {
  name                = "ctafleet-${local.environment}-aks"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = "ctafleet-${local.environment}"
  kubernetes_version  = var.kubernetes_version

  # ADD THESE SECURITY SETTINGS:
  local_account_disabled          = true                        # Disable local accounts
  api_server_authorized_ip_ranges = var.aks_authorized_ip_ranges  # Restrict API access

  default_node_pool {
    name                = "system"
    node_count          = var.aks_node_count
    vm_size             = var.aks_vm_size
    vnet_subnet_id      = azurerm_subnet.aks.id
    enable_auto_scaling = true
    min_count           = var.aks_min_nodes
    max_count           = var.aks_max_nodes
    os_disk_size_gb     = 100
    type                = "VirtualMachineScaleSets"
    zones               = ["1", "2", "3"]

    upgrade_settings {
      max_surge = "33%"
    }
  }

  identity {
    type = "SystemAssigned"
  }

  # ADD THIS BLOCK - Automatic cluster upgrades:
  automatic_channel_upgrade = "stable"

  # ADD THIS BLOCK - Azure AD RBAC integration:
  azure_active_directory_role_based_access_control {
    managed                = true
    azure_rbac_enabled     = true
    tenant_id              = data.azurerm_client_config.current.tenant_id
    admin_group_object_ids = var.aks_admin_group_ids
  }

  network_profile {
    network_plugin     = "azure"
    network_policy     = "azure"
    load_balancer_sku  = "standard"
    service_cidr       = "10.1.0.0/16"
    dns_service_ip     = "10.1.0.10"
    docker_bridge_cidr = "172.17.0.1/16"
  }

  azure_policy_enabled = true

  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }

  auto_scaler_profile {
    balance_similar_node_groups      = true
    max_graceful_termination_sec     = 600
    scale_down_delay_after_add       = "10m"
    scale_down_unneeded              = "10m"
    scale_down_utilization_threshold = 0.5
  }

  # ADD THIS BLOCK - Microsoft Defender for Containers:
  microsoft_defender {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }

  tags = local.common_tags
}
```

## New Variables Required

**Add to `variables.tf`**:

```hcl
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
```

## Configuration Updates Required

**Update `terraform.tfvars.example`** with:

```hcl
# Security: Storage Account IP Allowlist
allowed_storage_ips = [
  # "203.0.113.0/24",  # Example: Office network
  # "198.51.100.5/32", # Example: CI/CD server
]

# Security: Key Vault IP Allowlist
allowed_keyvault_ips = [
  # "203.0.113.0/24",  # Example: Office network
  # "198.51.100.5/32", # Example: CI/CD server
]

# Security: AKS API Server Authorized IP Ranges (REQUIRED)
aks_authorized_ip_ranges = [
  # "203.0.113.0/24",  # Example: Office network
  # "198.51.100.5/32", # Example: CI/CD server
]

# Security: AKS Admin Azure AD Groups (REQUIRED)
# Get object IDs from: az ad group list --display-name "your-group-name"
aks_admin_group_ids = [
  # "12345678-1234-1234-1234-123456789012",  # Example: AKS Admins group
]
```

## Implementation Steps

1. **Update variables.tf** with new security variables
2. **Update main.tf** with all security hardening changes
3. **Create terraform.tfvars** from example with actual IP ranges and group IDs
4. **Get Azure AD Group IDs**:
   ```bash
   az ad group list --display-name "AKS Admins" --query '[].id' -o tsv
   ```
5. **Run Terraform plan** to review changes
6. **Apply changes** in a maintenance window

## Security Impact

### Before Hardening
- ❌ Storage accounts publicly accessible
- ❌ TLS 1.0/1.1 allowed
- ❌ Key Vault accessible from internet
- ❌ AKS API server publicly accessible
- ❌ Local AKS accounts enabled
- ❌ No automatic security updates
- ❌ No Azure AD RBAC

### After Hardening
- ✅ Storage accounts private only
- ✅ TLS 1.2+ enforced
- ✅ Key Vault private endpoint only
- ✅ AKS API server IP-restricted
- ✅ Azure AD authentication required
- ✅ Automatic stable channel upgrades
- ✅ Full Azure RBAC integration
- ✅ Microsoft Defender enabled

## Compliance Impact

These changes bring the infrastructure into compliance with:
- **CIS Azure Foundations Benchmark**
- **SOC 2 Type II** requirements
- **NIST 800-53** controls
- **FedRAMP** security baseline
- **PCI DSS** network segmentation requirements

## Breaking Changes

⚠️ **WARNING**: These changes will cause service interruption:

1. **Key Vault**: Existing public access will be blocked. Deploy private endpoint first.
2. **AKS API**: Management access will require whitelisted IPs. Add your IPs before deploying.
3. **Storage**: Public blob access blocked. Ensure applications use SAS tokens or MSI.

## Rollback Plan

If issues occur:
1. Set `public_network_access_enabled = true` on Key Vault temporarily
2. Remove `api_server_authorized_ip_ranges` from AKS temporarily
3. Set `allow_blob_public_access = true` on Storage temporarily
4. Run `terraform apply` to restore access
5. Fix networking issues, then re-enable security settings

## Validation Checklist

After deployment:
- [ ] Storage Account: Verify public access blocked
- [ ] Storage Account: Verify TLS 1.2 enforcement
- [ ] Key Vault: Verify private endpoint connectivity
- [ ] Key Vault: Verify public access blocked
- [ ] AKS: Verify kubectl access works from authorized IPs
- [ ] AKS: Verify Azure AD authentication required
- [ ] AKS: Verify local accounts disabled
- [ ] AKS: Test auto-upgrade channel set to stable
- [ ] All services: Verify application connectivity maintained
