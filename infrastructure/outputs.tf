# output "container_registry_name" {
#   value       = azurerm_container_registry.main.name
#   description = "The name of the Azure Container Registry"
# }

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

output "document_chunking_queue_name" {
  value       = azurerm_storage_queue.document_chunking.name
  description = "The name of the document chunking queue"
}

output "document_embedding_queue_name" {
  value       = azurerm_storage_queue.document_embedding.name
  description = "The name of the document embedding queue"
}

output "api_identity_id" {
  value       = azurerm_user_assigned_identity.api.id
  description = "The ID of the API managed identity (for use with Container Apps)"
}

output "api_identity_client_id" {
  value       = azurerm_user_assigned_identity.api.client_id
  description = "The client ID of the API managed identity"
}

output "document_ingestion_client_id" {
  value = azurerm_user_assigned_identity.document_ingestion.client_id
  description = "The client ID of the Document Ingestion contaienr app job managed identity."
}

output "openai_endpoint" {
  value       = azurerm_cognitive_account.openai.endpoint
  description = "The endpoint URL for the Azure OpenAI service"
}

output "openai_deployment_name" {
  value       = azurerm_cognitive_deployment.gpt4o_mini.name
  description = "The name of the GPT-4o-mini deployment"
}

output "openai_embedding_deployment_name" {
  value       = azurerm_cognitive_deployment.text_embedding_3_small.name
  description = "The name of the text-embedding-3-small deployment"
}