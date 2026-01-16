output "container_registry_name" {
  value       = azurerm_container_registry.main.name
  description = "The name of the Azure Container Registry"
}

output "postgres_password" {
  value = random_password.postgres.result
  description = "The default password of the Postgres dev database."
  sensitive = true
}