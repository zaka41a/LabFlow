output "application_url" {
  description = "Public URL of the LabFlow web application."
  value       = "http://${azurerm_public_ip.application.fqdn}"
}

output "oidc_redirect_uri" {
  description = "Callback URI to register in the GitLab OpenID Connect application."
  value       = "http://${azurerm_public_ip.application.fqdn}/login/oauth2/code/labflow"
}

output "application_public_ip" {
  description = "Public IPv4 address assigned to the application VM."
  value       = azurerm_public_ip.application.ip_address
}

output "container_registry_name" {
  description = "Name used by CI to publish the LabFlow images."
  value       = azurerm_container_registry.main.name
}

output "container_registry_server" {
  description = "Login server used for Docker image references."
  value       = azurerm_container_registry.main.login_server
}

output "resource_group_name" {
  description = "Resource group containing all LabFlow resources."
  value       = azurerm_resource_group.main.name
}

output "virtual_machine_name" {
  description = "Virtual machine hosting the Docker Compose stack."
  value       = azurerm_linux_virtual_machine.application.name
}
