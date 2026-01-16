# Document Ingestion Job

Azure Container App Job that processes documents when they are uploaded to blob storage.

## How It Works

1. A file is uploaded to Azure Blob Storage
2. Azure Event Grid detects the blob created event
3. Event Grid triggers this Container App Job
4. The job downloads and processes the document

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BLOB_EVENT_DATA` | Yes | JSON event data from Event Grid (set automatically by trigger) |
| `STORAGE_ACCOUNT_URL` | No | Storage account URL (extracted from event if not set) |

## Local Development

```bash
# Install dependencies
uv sync

# Run with sample event data
BLOB_EVENT_DATA='{"subject":"/blobServices/default/containers/documents/blobs/test.pdf","source":"/subscriptions/xxx/resourceGroups/xxx/providers/Microsoft.Storage/storageAccounts/mystorageaccount"}' \
uv run python main.py
```

## Publishing to Azure Container Registry

The Terraform configuration provisions a private Azure Container Registry. To build and push the Docker image:

```bash
# Get the registry name from Terraform output
cd infrastructure
ACR_NAME=$(terraform output -raw container_registry_name)

# Login to the registry
az acr login --name $ACR_NAME

# Build and push the image
cd ../jobs/document-ingestion
docker build -t $ACR_NAME.azurecr.io/document-ingestion:latest .
docker push $ACR_NAME.azurecr.io/document-ingestion:latest
```

Alternatively, you can build directly in ACR:

```bash
cd jobs/document-ingestion
az acr build --registry $ACR_NAME --image document-ingestion:latest .
```

## Authentication

The job uses `DefaultAzureCredential` which supports:
- Managed Identity (when running in Azure)
- Azure CLI credentials (for local development)
- Environment variables (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`)
