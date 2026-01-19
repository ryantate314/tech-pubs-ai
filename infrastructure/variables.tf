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

variable "cors_allowed_origins" {
  type        = list(string)
  description = "Allowed origins for CORS on blob storage (for direct uploads)"
  default     = ["http://localhost:3000"]
}