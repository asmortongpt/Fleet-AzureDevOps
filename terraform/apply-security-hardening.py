#!/usr/bin/env python3
"""
Azure Infrastructure Security Hardening Script
Automatically applies security hardening changes to Terraform configuration
"""

import re
import sys
from pathlib import Path


def apply_storage_hardening(content: str) -> str:
    """Add security settings to Azure Storage Account"""

    # Find the storage account resource
    pattern = r'(resource "azurerm_storage_account" "main" \{[^\}]*account_kind\s*=\s*"StorageV2")'

    security_settings = '''

  # Security: Disable public blob access
  allow_blob_public_access  = false

  # Security: Enforce minimum TLS version
  min_tls_version           = "TLS1_2"

  # Security: Enforce HTTPS-only traffic
  enable_https_traffic_only = true'''

    replacement = r'\1' + security_settings
    content = re.sub(pattern, replacement, content)

    # Update network_rules to add ip_rules
    pattern = r'(network_rules \{[^\}]*virtual_network_subnet_ids\s*=\s*\[azurerm_subnet\.aks\.id\])'
    replacement = r'\1\n    ip_rules                   = var.allowed_storage_ips'
    content = re.sub(pattern, replacement, content)

    return content


def apply_keyvault_hardening(content: str) -> str:
    """Add security settings to Azure Key Vault"""

    # Add public_network_access_enabled setting
    pattern = r'(resource "azurerm_key_vault" "main" \{[^\}]*purge_protection_enabled\s*=\s*true)'

    security_settings = '''

  # Security: Disable public network access (use private endpoints only)
  public_network_access_enabled = false'''

    replacement = r'\1' + security_settings
    content = re.sub(pattern, replacement, content)

    # Update network_acls to add ip_rules
    pattern = r'(network_acls \{[^\}]*virtual_network_subnet_ids\s*=\s*\[azurerm_subnet\.aks\.id\])'
    replacement = r'\1\n    ip_rules                   = var.allowed_keyvault_ips'
    content = re.sub(pattern, replacement, content)

    # Add private endpoint resources after Key Vault
    pattern = r'(resource "azurerm_key_vault" "main" \{[^\}]*\n\})'

    private_endpoint_resources = '''

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
}'''

    replacement = r'\1' + private_endpoint_resources
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)

    return content


def apply_aks_hardening(content: str) -> str:
    """Add security settings to AKS cluster"""

    # Add security settings after kubernetes_version
    pattern = r'(resource "azurerm_kubernetes_cluster" "main" \{[^\}]*kubernetes_version\s*=\s*var\.kubernetes_version)'

    security_settings = '''

  # Security: Disable local accounts (use Azure AD only)
  local_account_disabled          = true

  # Security: Restrict API server access to authorized IPs only
  api_server_authorized_ip_ranges = var.aks_authorized_ip_ranges'''

    replacement = r'\1' + security_settings
    content = re.sub(pattern, replacement, content)

    # Add automatic_channel_upgrade after identity block
    pattern = r'(identity \{[^\}]*\n  \})'

    upgrade_settings = '''

  # Security: Enable automatic cluster upgrades
  automatic_channel_upgrade = "stable"'''

    replacement = r'\1' + upgrade_settings
    content = re.sub(pattern, replacement, content)

    # Add Azure AD RBAC after automatic_channel_upgrade
    pattern = r'(automatic_channel_upgrade\s*=\s*"stable")'

    azure_ad_rbac = '''

  # Security: Enable Azure AD RBAC integration
  azure_active_directory_role_based_access_control {
    managed                = true
    azure_rbac_enabled     = true
    tenant_id              = data.azurerm_client_config.current.tenant_id
    admin_group_object_ids = var.aks_admin_group_ids
  }'''

    replacement = r'\1' + azure_ad_rbac
    content = re.sub(pattern, replacement, content)

    # Add Microsoft Defender after auto_scaler_profile
    pattern = r'(auto_scaler_profile \{[^\}]*\n  \})'

    defender_settings = '''

  # Security: Enable Microsoft Defender for Containers
  microsoft_defender {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }'''

    replacement = r'\1' + defender_settings
    content = re.sub(pattern, replacement, content)

    return content


def apply_variable_updates(content: str) -> str:
    """Add new security variables to variables.tf"""

    # Find the allowed_ip_ranges variable and add new variables after it
    pattern = r'(variable "allowed_ip_ranges" \{[^\}]*\n\})'

    new_variables = '''

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
}'''

    replacement = r'\1' + new_variables
    content = re.sub(pattern, replacement, content)

    return content


def main():
    """Main execution function"""

    # Get terraform directory path
    terraform_dir = Path(__file__).parent
    main_tf = terraform_dir / "main.tf"
    variables_tf = terraform_dir / "variables.tf"

    print("🔒 Azure Infrastructure Security Hardening Script")
    print("=" * 60)

    # Backup original files
    print("\n📝 Creating backups...")
    main_tf_backup = terraform_dir / "main.tf.backup"
    variables_tf_backup = terraform_dir / "variables.tf.backup"

    with open(main_tf, 'r') as f:
        main_content = f.read()
    with open(main_tf_backup, 'w') as f:
        f.write(main_content)
    print(f"   ✓ Backed up main.tf to {main_tf_backup}")

    with open(variables_tf, 'r') as f:
        variables_content = f.read()
    with open(variables_tf_backup, 'w') as f:
        f.write(variables_content)
    print(f"   ✓ Backed up variables.tf to {variables_tf_backup}")

    # Apply hardening
    print("\n🛡️  Applying security hardening...")

    print("   ⏳ Hardening Storage Account...")
    main_content = apply_storage_hardening(main_content)
    print("   ✓ Storage Account hardened")

    print("   ⏳ Hardening Key Vault...")
    main_content = apply_keyvault_hardening(main_content)
    print("   ✓ Key Vault hardened")

    print("   ⏳ Hardening AKS Cluster...")
    main_content = apply_aks_hardening(main_content)
    print("   ✓ AKS Cluster hardened")

    print("   ⏳ Updating variables...")
    variables_content = apply_variable_updates(variables_content)
    print("   ✓ Variables updated")

    # Write hardened files
    print("\n💾 Writing hardened configuration...")
    with open(main_tf, 'w') as f:
        f.write(main_content)
    print(f"   ✓ Updated {main_tf}")

    with open(variables_tf, 'w') as f:
        f.write(variables_content)
    print(f"   ✓ Updated {variables_tf}")

    # Summary
    print("\n" + "=" * 60)
    print("✅ Security hardening complete!")
    print("\nNext steps:")
    print("1. Review changes: git diff terraform/main.tf terraform/variables.tf")
    print("2. Update terraform.tfvars with required IPs and group IDs")
    print("3. Run: terraform plan")
    print("4. Review the plan carefully")
    print("5. Apply: terraform apply")
    print("\n⚠️  Important: See SECURITY_HARDENING_CHANGES.md for details")


if __name__ == "__main__":
    main()
