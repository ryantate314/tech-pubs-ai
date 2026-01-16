variable "subscription_id" {
  type = string
}

variable "location" {
  type = string
  default = "eastus2"
}

variable "environment" {
  type = string
  default = "dev"
}

variable "database_url" {
  type        = string
  description = "PostgreSQL connection string for the document database"
  sensitive   = true
}