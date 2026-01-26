# Azure Database for PostgreSQL Flexible Server with pgvector support

# Generate a random password for Postgres
resource "random_password" "postgres" {
  length  = 32
  special = false
}

# PostgreSQL Flexible Server
# resource "azurerm_postgresql_flexible_server" "main" {
#   name                = "psql-${local.workload}-${var.environment}"
#   resource_group_name = azurerm_resource_group.main.name
#   location            = azurerm_resource_group.main.location

#   administrator_login    = "techpubs"
#   administrator_password = random_password.postgres.result

#   sku_name = "B_Standard_B1ms"
#   version  = "16"

#   storage_mb                   = 32768
#   backup_retention_days        = 7
#   geo_redundant_backup_enabled = false

#   zone = "1"
# }

# Allow Azure services to access the server (for Container Apps)
# resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
#   name             = "AllowAzureServices"
#   server_id        = azurerm_postgresql_flexible_server.main.id
#   start_ip_address = "0.0.0.0"
#   end_ip_address   = "0.0.0.0"
# }

# Enable pgvector extension
# resource "azurerm_postgresql_flexible_server_configuration" "extensions" {
#   name      = "azure.extensions"
#   server_id = azurerm_postgresql_flexible_server.main.id
#   value     = "vector"
# }

# Create the application database
# resource "azurerm_postgresql_flexible_server_database" "techpubs" {
#   name      = "techpubs"
#   server_id = azurerm_postgresql_flexible_server.main.id
#   charset   = "UTF8"
#   collation = "en_US.utf8"
# }
