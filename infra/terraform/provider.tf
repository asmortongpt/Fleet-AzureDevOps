terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.45"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Uncomment for remote state in Azure Storage
  # backend "azurerm" {
  #   resource_group_name  = "terraform-state-rg"
  #   storage_account_name = "tfstate<unique-id>"
  #   container_name       = "tfstate"
  #   key                  = "radio-fleet-dispatch.tfstate"
  # }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = var.environment == "dev"
      recover_soft_deleted_key_vaults = true
    }

    resource_group {
      prevent_deletion_if_contains_resources = var.environment == "production"
    }

    virtual_machine {
      delete_os_disk_on_deletion     = true
      graceful_shutdown              = var.environment == "production"
      skip_shutdown_and_force_delete = var.environment != "production"
    }
  }
}

provider "azuread" {}
