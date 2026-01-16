output "container_registry_name" {
  value       = azurerm_container_registry.main.name
  description = "The name of the Azure Container Registry"
}

output "postgres_password" {
  value       = random_password.postgres.result
  description = "The default password of the Postgres dev database."
  sensitive   = true
}

output "storage_account_name" {
  value       = azurerm_storage_account.main.name
  description = "The name of the storage account"
}

output "storage_queue_url" {
  value       = azurerm_storage_account.main.primary_queue_endpoint
  description = "The URL of the storage queue endpoint"
}

output "document_ingestion_queue_name" {
  value       = azurerm_storage_queue.document_ingestion.name
  description = "The name of the document ingestion queue"
}

output "api_identity_id" {
  value       = azurerm_user_assigned_identity.api.id
  description = "The ID of the API managed identity (for use with Container Apps)"
}

output "api_identity_client_id" {
  value       = azurerm_user_assigned_identity.api.client_id
  description = "The client ID of the API managed identity"
}