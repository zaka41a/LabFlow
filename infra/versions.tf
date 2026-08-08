terraform {
  required_version = ">= 1.8.0"

  backend "http" {}

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.81"
    }
  }
}

provider "azurerm" {
  features {}
}
