# Azure OpenAI Service for chunk summarization
resource "azurerm_cognitive_account" "openai" {
  name                  = "cog-${local.workload}-${var.environment}"
  location              = azurerm_resource_group.main.location
  resource_group_name   = azurerm_resource_group.main.name
  kind                  = "OpenAI"
  sku_name              = "S0"
  custom_subdomain_name = "cog-${local.workload}-${var.environment}"
}

resource "azurerm_cognitive_deployment" "gpt4o" {
  name                 = "gpt-4o"
  cognitive_account_id = azurerm_cognitive_account.openai.id
  model {
    format  = "OpenAI"
    name    = "gpt-4o"
    version = "2024-08-06"
  }
  sku {
    name     = "Standard"
    capacity = 10
  }
}

resource "azurerm_cognitive_deployment" "text_embedding_3_small" {
  name                 = "text-embedding-3-small"
  cognitive_account_id = azurerm_cognitive_account.openai.id
  model {
    format  = "OpenAI"
    name    = "text-embedding-3-small"
    version = "1"
  }
  sku {
    name     = "Standard"
    capacity = 120  # 120K tokens per minute
  }
}

# Grant the API identity access to use Azure OpenAI
resource "azurerm_role_assignment" "api_openai_user" {
  scope                = azurerm_cognitive_account.openai.id
  role_definition_name = "Cognitive Services OpenAI User"
  principal_id         = azurerm_user_assigned_identity.api.principal_id
}

# Grant the document ingestion job identity access to use Azure OpenAI (for embeddings)
resource "azurerm_role_assignment" "document_ingestion_openai_user" {
  scope                = azurerm_cognitive_account.openai.id
  role_definition_name = "Cognitive Services OpenAI User"
  principal_id         = azurerm_user_assigned_identity.document_ingestion.principal_id
}
