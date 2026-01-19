# Document Ingestion Job

Azure Container App Job that processes documents from the queue when they are uploaded.

## How It Works

1. A file is uploaded to Azure Blob Storage via the API
2. The API creates a DocumentJob record and sends a message to the queue
3. The queue triggers this Container App Job
4. The job downloads the document, extracts text chunks, generates embeddings, and stores them in the database

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `STORAGE_ACCOUNT_URL` | Yes | Azure Blob Storage URL |
| `STORAGE_QUEUE_URL` | Yes | Azure Queue Storage URL |
| `QUEUE_NAME` | Yes | Name of the queue to poll for jobs |
| `DATABASE_URL` | Yes | PostgreSQL connection string |

## Local Development

```bash
# From the repo root
cd /path/to/tech-pubs-v3

# Install dependencies
uv sync

# Run the job (requires environment variables)
cd jobs/document-ingestion
uv run python main.py
```

## Docker Build

This project uses a uv monorepo. Docker builds must be run from the **repo root**:

```bash
# From the repo root
cd /path/to/tech-pubs-v3

# Build the image
docker build -f jobs/document-ingestion/Dockerfile -t document-ingestion .

# Run locally
docker run --env-file jobs/document-ingestion/.env document-ingestion
```

## Publishing to Azure Container Registry

```bash
# From the repo root
cd /path/to/tech-pubs-v3

# Get the registry name from Terraform output
ACR_NAME=$(cd infrastructure && terraform output -raw container_registry_name)

# Login to the registry
az acr login --name $ACR_NAME

# Build and push the image
docker build -f jobs/document-ingestion/Dockerfile -t $ACR_NAME.azurecr.io/document-ingestion:latest .
docker push $ACR_NAME.azurecr.io/document-ingestion:latest
```

Or build directly in ACR:

```bash
# From the repo root
az acr build \
  --registry $ACR_NAME \
  --image document-ingestion:latest \
  --file jobs/document-ingestion/Dockerfile \
  .
```

## Authentication

The job uses `DefaultAzureCredential` which supports:
- Managed Identity (when running in Azure)
- Azure CLI credentials (for local development)
- Environment variables (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`)
