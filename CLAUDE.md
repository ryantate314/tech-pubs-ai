# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tech Pubs v3 is a document management system for uploading, processing, and searching PDF documents using AI-powered semantic search.

- **app/ui/** - NextJS 16 frontend (React 19) for document viewing, searching, and admin uploads
- **app/api/** - Python FastAPI backend
- **jobs/** - Python container jobs for document processing (Azure Container App Jobs)
  - **document-chunking/** - Chunks PDFs using Docling parser
  - **document-embedding/** - Generates embeddings with BAAI/bge-base-en-v1.5
  - **base/** - Shared Docker base image with PyTorch
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
make api-run                      # Quick start (from repo root)
# OR
cd app/api
cp .env.example .env              # Configure environment variables
uv run uvicorn main:app --reload  # Start dev server at http://localhost:8000
```

### UI

```bash
make nextjs-run                   # Quick start (from repo root)
# OR
cd app/ui
npm install                       # Install dependencies
npm run dev                       # Start dev server at http://localhost:3000
npm run lint                      # Run ESLint
npm run build                     # Production build
```

Set `API_URL=http://localhost:8000` in `app/ui/.env.local` to connect to local API.

### Document Processing Jobs

```bash
make run-chunking-job             # Run chunking job with .env file
make run-embedding-job            # Run embedding job with .env file
```

Docker builds must be run from repo root due to uv workspace:
```bash
make publish-jobs-base            # Build and push base image (required first)
make publish-document-chunking    # Build and push chunking job
make publish-document-embedding   # Build and push embedding job
make publish-all-jobs             # Build and push all jobs
```

### Infrastructure (Terraform)

```bash
cd infrastructure
terraform init
terraform plan -var="subscription_id=<YOUR_SUBSCRIPTION_ID>"
terraform apply -var="subscription_id=<YOUR_SUBSCRIPTION_ID>"
# OR from repo root:
make terraform-apply              # Uses config/dev.tfvars
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
2. API creates DocumentJob record and queues message → Azure Queue Storage
3. Document Chunking Job: downloads PDF → parses with Docling → stores chunks in DB
4. Document Embedding Job: reads chunks → generates embeddings (BAAI/bge-base-en-v1.5) → stores vectors in Postgres with pgvector
5. Users search/view documents through UI

## API Proxy Pattern (IMPORTANT)

The UI does NOT call the FastAPI backend directly. All API calls go through NextJS API route handlers that proxy to the backend:

```
React Component → lib/api/client.ts → app/api/.../route.ts → lib/api/server.ts → FastAPI
```

**When adding or modifying API endpoints, you MUST update all layers:**

1. **FastAPI endpoint** (`app/api/routers/`) - The actual backend logic
2. **NextJS proxy route** (`app/ui/src/app/api/.../route.ts`) - Proxies to FastAPI using `serverFetch`
3. **Client API function** (`app/ui/src/lib/api/`) - Calls the NextJS route using `apiRequest`
4. **TypeScript types** (`app/ui/src/types/`) - Request/response types

Example for a new `/api/jobs/{id}` endpoint:
- `app/api/routers/jobs.py` - FastAPI route
- `app/ui/src/app/api/jobs/[id]/route.ts` - NextJS proxy
- `app/ui/src/lib/api/jobs.ts` - Client function
- `app/ui/src/types/jobs.ts` - Types

**Do not skip step 2 (NextJS proxy route)** - the frontend cannot reach the FastAPI backend without it.

## Shared Library (techpubs-core)

`packages/techpubs-core/` contains shared code used by both the API and processing jobs:
- Database models: `Platform`, `Generation`, `AircraftModel`, `DocumentCategory`, `DocumentType`, `Category`, `Document`, `DocumentVersion`, `DocumentChunk`, `DocumentJob`, `DocumentSerialRange`
- Database utilities: `get_engine`, `get_session`, `get_session_factory`
- Embeddings utilities (optional `[embeddings]` extra): sentence-transformers wrapper

## Key Environment Variables

All Python components require:
- `DATABASE_URL` - PostgreSQL connection string
- `STORAGE_ACCOUNT_URL` - Azure Blob Storage URL
- `STORAGE_QUEUE_URL` - Azure Queue Storage URL
- `QUEUE_NAME` - Queue name for document ingestion jobs

## Database Management

### Migrations (Flyway)

```bash
cp database/.env.example database/.env  # Configure credentials (JDBC format)
make db-info                            # Show migration status
make db-migrate                         # Run pending migrations
make db-validate                        # Validate applied migrations
make db-baseline                        # Baseline existing database at V1
```

Create new migration:
```bash
make db-add DESC=add_new_table    # Creates database/migrations/V{next}__add_new_table.sql
```

### Azure PostgreSQL

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
