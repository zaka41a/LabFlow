locals {
  resource_prefix         = "labflow-${var.environment}-${var.name_suffix}"
  compact_name            = substr("labflow${var.environment}${var.name_suffix}", 0, 20)
  storage_account_name    = substr("${local.compact_name}st", 0, 24)
  registry_name           = substr("${local.compact_name}cr", 0, 50)
  oidc_form_action_origin = regex("^https?://[^/]+", var.oidc_authorization_uri)
}

resource "azurerm_resource_group" "main" {
  name     = "rg-${local.resource_prefix}"
  location = var.location

  tags = {
    application = "LabFlow"
    environment = var.environment
    managed_by  = "Terraform"
  }
}

resource "azurerm_storage_account" "main" {
  name                          = local.storage_account_name
  resource_group_name           = azurerm_resource_group.main.name
  location                      = azurerm_resource_group.main.location
  account_tier                  = "Standard"
  account_replication_type      = "LRS"
  min_tls_version               = "TLS1_2"
  public_network_access_enabled = true

  blob_properties {
    versioning_enabled = true

    delete_retention_policy {
      days = 7
    }
  }

  tags = azurerm_resource_group.main.tags
}

resource "azurerm_storage_container" "labflow" {
  name                  = "labflow"
  storage_account_id    = azurerm_storage_account.main.id
  container_access_type = "private"
}

resource "azurerm_container_registry" "main" {
  name                = local.registry_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = false

  tags = azurerm_resource_group.main.tags
}

resource "azurerm_virtual_network" "main" {
  name                = "vnet-${local.resource_prefix}"
  address_space       = ["10.42.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  tags = azurerm_resource_group.main.tags
}

resource "azurerm_subnet" "application" {
  name                 = "snet-application"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.42.1.0/24"]
}

resource "azurerm_public_ip" "application" {
  name                = "pip-${local.resource_prefix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  allocation_method   = "Static"
  sku                 = "Standard"
  domain_name_label   = local.resource_prefix

  tags = azurerm_resource_group.main.tags
}

resource "azurerm_network_security_group" "application" {
  name                = "nsg-${local.resource_prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                       = "AllowHttp"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowSshFromAdministrator"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = var.admin_source_cidr
    destination_address_prefix = "*"
  }

  tags = azurerm_resource_group.main.tags
}

resource "azurerm_network_interface" "application" {
  name                = "nic-${local.resource_prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  ip_configuration {
    name                          = "primary"
    subnet_id                     = azurerm_subnet.application.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.application.id
  }

  tags = azurerm_resource_group.main.tags
}

resource "azurerm_network_interface_security_group_association" "application" {
  network_interface_id      = azurerm_network_interface.application.id
  network_security_group_id = azurerm_network_security_group.application.id
}

resource "azurerm_linux_virtual_machine" "application" {
  name                            = "vm-${local.resource_prefix}"
  resource_group_name             = azurerm_resource_group.main.name
  location                        = azurerm_resource_group.main.location
  size                            = var.vm_size
  admin_username                  = var.admin_username
  disable_password_authentication = true
  network_interface_ids           = [azurerm_network_interface.application.id]

  admin_ssh_key {
    username   = var.admin_username
    public_key = var.admin_ssh_public_key
  }

  identity {
    type = "SystemAssigned"
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "ubuntu-24_04-lts"
    sku       = "server"
    version   = "latest"
  }

  custom_data = base64encode(templatefile("${path.module}/cloud-init.yaml.tftpl", {
    registry_name              = azurerm_container_registry.main.name
    registry_server            = azurerm_container_registry.main.login_server
    image_tag                  = var.image_tag
    application_origin         = "http://${azurerm_public_ip.application.fqdn}"
    storage_connection_string  = azurerm_storage_account.main.primary_connection_string
    borrower_password_hash     = replace(var.borrower_password_hash, "$", "$$")
    manager_password_hash      = replace(var.manager_password_hash, "$", "$$")
    technician_password_hash   = replace(var.technician_password_hash, "$", "$$")
    oidc_client_id             = var.oidc_client_id
    oidc_client_secret         = replace(var.oidc_client_secret, "$", "$$")
    oidc_client_auth_method    = var.oidc_client_authentication_method
    oidc_public_issuer_uri     = var.oidc_public_issuer_uri
    oidc_authorization_uri     = var.oidc_authorization_uri
    oidc_form_action_origin    = local.oidc_form_action_origin
    oidc_token_uri             = var.oidc_token_uri
    oidc_jwk_set_uri           = var.oidc_jwk_set_uri
    oidc_user_info_uri         = var.oidc_user_info_uri
    oidc_borrower_identities   = join(",", var.oidc_borrower_identities)
    oidc_manager_identities    = join(",", var.oidc_manager_identities)
    oidc_technician_identities = join(",", var.oidc_technician_identities)
  }))

  tags = azurerm_resource_group.main.tags

  depends_on = [
    azurerm_network_interface_security_group_association.application
  ]
}

resource "azurerm_role_assignment" "acr_pull" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_linux_virtual_machine.application.identity[0].principal_id
}
