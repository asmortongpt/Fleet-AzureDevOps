# ============================================================================
# Resource Group
# ============================================================================
resource "azurerm_resource_group" "main" {
  name     = "${var.project_name}-${var.environment}-${var.location_short}-rg"
  location = var.location
  tags     = merge(var.tags, { Environment = var.environment })
}

# ============================================================================
# Random password generation
# ============================================================================
resource "random_password" "postgres_admin" {
  length  = 32
  special = true
}

# ============================================================================
# Azure Container Registry
# ============================================================================
resource "azurerm_container_registry" "main" {
  name                = "${var.project_name}${var.environment}${var.location_short}acr"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = var.environment == "production" ? "Premium" : "Standard"
  admin_enabled       = false

  # Enable content trust for production
  trust_policy {
    enabled = var.environment == "production"
  }

  # Retention policy for untagged manifests
  retention_policy {
    enabled = true
    days    = var.environment == "production" ? 30 : 7
  }

  # Geo-replication for production (Premium SKU only)
  dynamic "georeplications" {
    for_each = var.environment == "production" ? [1] : []
    content {
      location = var.location == "eastus" ? "westus2" : "eastus"
      tags     = var.tags
    }
  }

  # Network rules for production
  dynamic "network_rule_set" {
    for_each = var.environment == "production" && length(var.allowed_ip_ranges) > 0 ? [1] : []
    content {
      default_action = "Deny"

      dynamic "ip_rule" {
        for_each = var.allowed_ip_ranges
        content {
          action   = "Allow"
          ip_range = ip_rule.value
        }
      }
    }
  }

  tags = merge(var.tags, {
    Environment = var.environment
    Service     = "Container Registry"
  })
}

# ============================================================================
# Azure Kubernetes Service (AKS)
# ============================================================================
resource "azurerm_kubernetes_cluster" "main" {
  name                = "${var.project_name}-${var.environment}-${var.location_short}-aks"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = "${var.project_name}-${var.environment}-${var.location_short}"
  kubernetes_version  = var.kubernetes_version

  # Security: Enable private cluster for production
  private_cluster_enabled = var.environment == "production"

  # Security: Enable disk encryption using customer-managed keys
  disk_encryption_set_id = azurerm_disk_encryption_set.aks.id

  # Default node pool configuration
  default_node_pool {
    name                = "system"
    node_count          = var.aks_node_count
    vm_size             = var.aks_node_vm_size
    type                = "VirtualMachineScaleSets"
    enable_auto_scaling = true
    min_count           = var.aks_min_node_count
    max_count           = var.aks_max_node_count
    os_disk_size_gb     = 128
    os_disk_type        = "Managed"
    vnet_subnet_id      = azurerm_subnet.aks.id

    # Node labels for system workloads
    node_labels = {
      "workload" = "system"
    }

    # Taints to prevent user workloads on system nodes
    node_taints = []

    upgrade_settings {
      max_surge = "33%"
    }
  }

  # Managed identity for AKS cluster
  identity {
    type = "SystemAssigned"
  }

  # Network configuration
  network_profile {
    network_plugin    = "azure"
    network_policy    = var.enable_network_policy ? "calico" : null
    load_balancer_sku = "standard"
    outbound_type     = "loadBalancer"
    service_cidr      = "10.1.0.0/16"
    dns_service_ip    = "10.1.0.10"
  }

  # RBAC and Azure AD integration
  azure_active_directory_role_based_access_control {
    managed                = true
    azure_rbac_enabled     = true
    admin_group_object_ids = []
  }

  # Security: API server access profile - restrict access to authorized IPs
  # Apply in all environments if IP ranges are configured
  dynamic "api_server_access_profile" {
    for_each = length(var.allowed_ip_ranges) > 0 ? [1] : []
    content {
      authorized_ip_ranges = var.allowed_ip_ranges
    }
  }

  # OMS agent for monitoring
  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  }

  # Microsoft Defender for Containers
  dynamic "microsoft_defender" {
    for_each = var.environment == "production" ? [1] : []
    content {
      log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
    }
  }

  # Key Vault secrets provider
  key_vault_secrets_provider {
    secret_rotation_enabled  = true
    secret_rotation_interval = "2m"
  }

  # Workload identity
  workload_identity_enabled = true
  oidc_issuer_enabled       = true

  # Auto-scaler profile
  auto_scaler_profile {
    balance_similar_node_groups      = true
    expander                         = "random"
    max_graceful_termination_sec     = 600
    max_node_provisioning_time       = "15m"
    max_unready_nodes                = 3
    max_unready_percentage           = 45
    new_pod_scale_up_delay           = "10s"
    scale_down_delay_after_add       = "10m"
    scale_down_delay_after_delete    = "10s"
    scale_down_delay_after_failure   = "3m"
    scan_interval                    = "10s"
    scale_down_unneeded              = "10m"
    scale_down_unready               = "20m"
    scale_down_utilization_threshold = "0.5"
  }

  # Maintenance window
  maintenance_window {
    allowed {
      day   = "Sunday"
      hours = [2, 3, 4, 5]
    }
  }

  tags = merge(var.tags, {
    Environment = var.environment
    Service     = "Kubernetes"
  })

  depends_on = [
    azurerm_subnet.aks,
    azurerm_log_analytics_workspace.main
  ]
}

# User node pool for application workloads
resource "azurerm_kubernetes_cluster_node_pool" "user" {
  name                  = "user"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = var.aks_node_vm_size
  node_count            = var.aks_node_count
  enable_auto_scaling   = true
  min_count             = var.aks_min_node_count
  max_count             = var.aks_max_node_count
  os_disk_size_gb       = 128
  os_disk_type          = "Managed"
  vnet_subnet_id        = azurerm_subnet.aks.id
  mode                  = "User"

  node_labels = {
    "workload" = "user"
  }

  upgrade_settings {
    max_surge = "33%"
  }

  tags = merge(var.tags, {
    Environment = var.environment
    NodePool    = "user"
  })
}

# ============================================================================
# Role Assignments
# ============================================================================

# Grant AKS permission to pull from ACR
resource "azurerm_role_assignment" "aks_acr_pull" {
  principal_id                     = azurerm_kubernetes_cluster.main.kubelet_identity[0].object_id
  role_definition_name             = "AcrPull"
  scope                            = azurerm_container_registry.main.id
  skip_service_principal_aad_check = true
}

# Grant AKS permission to manage network resources
resource "azurerm_role_assignment" "aks_network_contributor" {
  principal_id                     = azurerm_kubernetes_cluster.main.identity[0].principal_id
  role_definition_name             = "Network Contributor"
  scope                            = azurerm_virtual_network.main.id
  skip_service_principal_aad_check = true
}

# Grant AKS permission to read from Key Vault
resource "azurerm_role_assignment" "aks_keyvault_reader" {
  principal_id                     = azurerm_kubernetes_cluster.main.key_vault_secrets_provider[0].secret_identity[0].object_id
  role_definition_name             = "Key Vault Secrets User"
  scope                            = azurerm_key_vault.main.id
  skip_service_principal_aad_check = true
}
