locals {
  workload = "techpubsai"
}

resource "azurerm_resource_group" "main" {
  name     = "rg-${local.workload}-${var.environment}"
  location = var.location
}

resource "random_string" "unique" {
  length  = 6
  upper   = false
  special = false
}

resource "azurerm_storage_account" "main" {
  name                     = "sa${local.workload}${random_string.unique.result}"
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  resource_group_name      = azurerm_resource_group.main.name

  blob_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["PUT"]
      allowed_origins    = var.cors_allowed_origins
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "HEAD"]
      allowed_origins    = var.cors_allowed_origins
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
  }
}

resource "azurerm_storage_container" "documents" {
  name               = "documents"
  storage_account_id = azurerm_storage_account.main.id
}

# Storage Queues for document processing jobs
resource "azurerm_storage_queue" "document_chunking" {
  name               = "document-chunking"
  storage_account_id = azurerm_storage_account.main.id
}

resource "azurerm_storage_queue" "document_embedding" {
  name               = "document-embedding"
  storage_account_id = azurerm_storage_account.main.id
}

# Container Registry for storing the document ingestion job image
# resource "azurerm_container_registry" "main" {
#   name                = "cr${local.workload}${random_string.unique.result}"
#   resource_group_name = azurerm_resource_group.main.name
#   location            = azurerm_resource_group.main.location
#   sku                 = "Basic"
#   admin_enabled       = true
# }

# Log Analytics Workspace for Container Apps Environment
# resource "azurerm_log_analytics_workspace" "main" {
#   name                = "log-${local.workload}-${var.environment}"
#   resource_group_name = azurerm_resource_group.main.name
#   location            = azurerm_resource_group.main.location
#   sku                 = "PerGB2018"
#   retention_in_days   = 30
# }

# Container Apps Environment
# resource "azurerm_container_app_environment" "main" {
#   name                       = "cae-${local.workload}-${var.environment}"
#   resource_group_name        = azurerm_resource_group.main.name
#   location                   = azurerm_resource_group.main.location
#   log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
# }

# User Assigned Identity for the Container App Job
resource "azurerm_user_assigned_identity" "document_ingestion" {
  name                = "id-document-ingestion-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
}

# Grant the identity access to read blobs from storage
resource "azurerm_role_assignment" "document_ingestion_blob_reader" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Blob Data Reader"
  principal_id         = azurerm_user_assigned_identity.document_ingestion.principal_id
}

# Grant the identity access to process queue messages
resource "azurerm_role_assignment" "document_ingestion_queue_processor" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Queue Data Message Processor"
  principal_id         = azurerm_user_assigned_identity.document_ingestion.principal_id
}

# User Assigned Identity for the API (to send queue messages and upload blobs)
resource "azurerm_user_assigned_identity" "api" {
  name                = "id-api-${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
}

# Grant the API identity access to write blobs to storage
resource "azurerm_role_assignment" "api_blob_contributor" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.api.principal_id
}

# Grant the API identity access to generate User Delegation SAS tokens
resource "azurerm_role_assignment" "api_blob_delegator" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Blob Delegator"
  principal_id         = azurerm_user_assigned_identity.api.principal_id
}

# Grant the API identity access to send queue messages
resource "azurerm_role_assignment" "api_queue_sender" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Queue Data Message Sender"
  principal_id         = azurerm_user_assigned_identity.api.principal_id
}

# Grant the identity access to pull images from ACR
# resource "azurerm_role_assignment" "document_ingestion_acr_pull" {
#   scope                = azurerm_container_registry.main.id
#   role_definition_name = "AcrPull"
#   principal_id         = azurerm_user_assigned_identity.document_ingestion.principal_id
# }

# Container App Job for document chunking (event-driven)
# resource "azurerm_container_app_job" "document_chunking" {
#   name                         = "caj-document-chunking-${var.environment}"
#   resource_group_name          = azurerm_resource_group.main.name
#   location                     = azurerm_resource_group.main.location
#   container_app_environment_id = azurerm_container_app_environment.main.id

#   replica_timeout_in_seconds = 600
#   replica_retry_limit        = 1

#   identity {
#     type         = "UserAssigned"
#     identity_ids = [azurerm_user_assigned_identity.document_ingestion.id]
#   }

#   registry {
#     server   = azurerm_container_registry.main.login_server
#     identity = azurerm_user_assigned_identity.document_ingestion.id
#   }

#   event_trigger_config {
#     parallelism              = 1
#     replica_completion_count = 1

#     scale {
#       min_executions              = 0
#       max_executions              = 10
#       polling_interval_in_seconds = 30

#       rules {
#         name             = "queue-trigger"
#         custom_rule_type = "azure-queue"
#         metadata = {
#           queueName   = azurerm_storage_queue.document_chunking.name
#           accountName = azurerm_storage_account.main.name
#         }
#         authentication {
#           secret_name       = "storage-connection-string"
#           trigger_parameter = "connection"
#         }
#       }
#     }
#   }

#   secret {
#     name  = "storage-connection-string"
#     value = azurerm_storage_account.main.primary_connection_string
#   }

#   secret {
#     name  = "database-url"
#     value = var.database_url
#   }

#   template {
#     container {
#       name   = "document-chunking"
#       image  = "${azurerm_container_registry.main.login_server}/document-chunking:latest"
#       cpu    = 0.5
#       memory = "1Gi"

#       env {
#         name  = "STORAGE_ACCOUNT_URL"
#         value = azurerm_storage_account.main.primary_blob_endpoint
#       }

#       env {
#         name  = "STORAGE_QUEUE_URL"
#         value = azurerm_storage_account.main.primary_queue_endpoint
#       }

#       env {
#         name  = "QUEUE_NAME"
#         value = azurerm_storage_queue.document_chunking.name
#       }

#       env {
#         name  = "EMBEDDING_QUEUE_NAME"
#         value = azurerm_storage_queue.document_embedding.name
#       }

#       env {
#         name        = "DATABASE_URL"
#         secret_name = "database-url"
#       }

#       env {
#         name  = "AZURE_CLIENT_ID"
#         value = azurerm_user_assigned_identity.document_ingestion.client_id
#       }
#     }
#   }

#   depends_on = [
#     azurerm_role_assignment.document_ingestion_acr_pull,
#     azurerm_role_assignment.document_ingestion_blob_reader,
#     azurerm_role_assignment.document_ingestion_queue_processor
#   ]
# }

# Container App Job for document embedding (event-driven)
# resource "azurerm_container_app_job" "document_embedding" {
#   name                         = "caj-document-embedding-${var.environment}"
#   resource_group_name          = azurerm_resource_group.main.name
#   location                     = azurerm_resource_group.main.location
#   container_app_environment_id = azurerm_container_app_environment.main.id

#   replica_timeout_in_seconds = 300
#   replica_retry_limit        = 1

#   identity {
#     type         = "UserAssigned"
#     identity_ids = [azurerm_user_assigned_identity.document_ingestion.id]
#   }

#   registry {
#     server   = azurerm_container_registry.main.login_server
#     identity = azurerm_user_assigned_identity.document_ingestion.id
#   }

#   event_trigger_config {
#     parallelism              = 1
#     replica_completion_count = 1

#     scale {
#       min_executions              = 0
#       max_executions              = 50
#       polling_interval_in_seconds = 30

#       rules {
#         name             = "queue-trigger"
#         custom_rule_type = "azure-queue"
#         metadata = {
#           queueName   = azurerm_storage_queue.document_embedding.name
#           accountName = azurerm_storage_account.main.name
#         }
#         authentication {
#           secret_name       = "storage-connection-string"
#           trigger_parameter = "connection"
#         }
#       }
#     }
#   }

#   secret {
#     name  = "storage-connection-string"
#     value = azurerm_storage_account.main.primary_connection_string
#   }

#   secret {
#     name  = "database-url"
#     value = var.database_url
#   }

#   template {
#     container {
#       name   = "document-embedding"
#       image  = "${azurerm_container_registry.main.login_server}/document-embedding:latest"
#       cpu    = 0.5
#       memory = "1Gi"

#       env {
#         name  = "STORAGE_QUEUE_URL"
#         value = azurerm_storage_account.main.primary_queue_endpoint
#       }

#       env {
#         name  = "QUEUE_NAME"
#         value = azurerm_storage_queue.document_embedding.name
#       }

#       env {
#         name        = "DATABASE_URL"
#         secret_name = "database-url"
#       }

#       env {
#         name  = "AZURE_CLIENT_ID"
#         value = azurerm_user_assigned_identity.document_ingestion.client_id
#       }
#     }
#   }

#   depends_on = [
#     azurerm_role_assignment.document_ingestion_acr_pull,
#     azurerm_role_assignment.document_ingestion_blob_reader,
#     azurerm_role_assignment.document_ingestion_queue_processor
#   ]
# }

