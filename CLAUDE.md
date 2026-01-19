# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tech Pubs v3 is a document management system for uploading, processing, and searching PDF documents using AI-powered semantic search.

- **app/ui/** - NextJS 16 frontend (React 19) for document viewing, searching, and admin uploads
- **app/api/** - Python FastAPI backend
- **jobs/document-ingestion/** - Python job for processing/ingesting documents (runs as Azure Container App Job)
- **packages/techpubs-core/** - Shared Python library with database models and utilities
- **infrastructure/** - Terraform configuration for Azure (azurerm provider)
- **database/migrations/** - SQL migration files

## Build Commands

### Python (uv workspace)

This is a uv monorepo. Always run `uv sync` from the repo root to install all workspace members:

```bash
uv sync                           # Install all dependencies (from repo root)
```

### API

```bash
cd app/api
cp .env.example .env              # Configure environment variables
uv run uvicorn main:app --reload  # Start dev server at http://localhost:8000
```

### UI

```bash
cd app/ui
npm install                       # Install dependencies
npm run dev                       # Start dev server at http://localhost:3000
npm run lint                      # Run ESLint
npm run build                     # Production build
```

Set `API_URL=http://localhost:8000` in `app/ui/.env.local` to connect to local API.

### Document Ingestion Job

```bash
make run-document-ingestion       # Run with .env file (from repo root)
# OR
cd jobs/document-ingestion
uv run python main.py
```

Docker builds must be run from repo root due to uv workspace:
```bash
make build-document-ingestion     # Build Docker image
make publish-document-ingestion   # Build and push to Azure Container Registry
```

### Infrastructure (Terraform)

```bash
cd infrastructure
terraform init
terraform plan -var="subscription_id=<YOUR_SUBSCRIPTION_ID>"
terraform apply -var="subscription_id=<YOUR_SUBSCRIPTION_ID>"
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   NextJS UI     │────▶│  FastAPI API    │────▶│    Postgres     │
│  (View/Search)  │     │                 │     │  (Metadata +    │
│  (Admin Upload) │     │                 │     │   pgvector)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               ▲
        │                                               │
        ▼                                               │
┌─────────────────┐     ┌─────────────────┐            │
│  Azure Blob     │────▶│ Document        │────────────┘
│  Storage        │     │ Ingestion Job   │
└─────────────────┘     └─────────────────┘
```

1. Admin uploads PDF → Azure Blob Storage (via presigned URL from API)
2. API queues ingestion message → Azure Queue Storage
3. Container App Job processes: downloads document → chunks with Docling → generates embeddings (BAAI/bge-base-en-v1.5) → stores in Postgres with pgvector
4. Users search/view documents through UI

## Shared Library (techpubs-core)

`packages/techpubs-core/` contains shared code used by both the API and ingestion job:
- Database models: `AircraftModel`, `Category`, `Document`, `DocumentVersion`, `DocumentChunk`, `DocumentJob`
- Database utilities: `get_engine`, `get_session`, `get_session_factory`

## Key Environment Variables

All Python components require:
- `DATABASE_URL` - PostgreSQL connection string
- `STORAGE_ACCOUNT_URL` - Azure Blob Storage URL
- `STORAGE_QUEUE_URL` - Azure Queue Storage URL
- `QUEUE_NAME` - Queue name for document ingestion jobs

## Database Management

```bash
# Stop PostgreSQL (save costs when not in use)
az postgres flexible-server stop --resource-group rg-techpubsai-dev --name psql-techpubsai-dev

# Start PostgreSQL
az postgres flexible-server start --resource-group rg-techpubsai-dev --name psql-techpubsai-dev
```

Enable pgvector after first deployment: `CREATE EXTENSION vector;`

## Notes

- Python version: 3.12 (specified in `.python-version`)
- The ingestion job uses CPU-only PyTorch to keep Docker image size manageable (~2-4GB vs ~16GB with CUDA)
- Azure authentication uses `DefaultAzureCredential` (supports Managed Identity, Azure CLI, or env vars)
