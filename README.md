# Tech Pubs AI

A document management system for uploading, processing, and searching PDF documents using AI-powered semantic search.

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

1. Admin users upload PDF files via the NextJS interface to Azure Blob Storage
2. Blob upload triggers the document ingestion job (Azure Container App Job)
3. The job chunks documents and generates embeddings
4. Metadata and vectors are stored in Postgres (with pgvector extension)
5. Users search and view documents through the NextJS UI

## Project Structure

```
├── app/
│   ├── ui/                  # NextJS frontend
│   └── api/                 # FastAPI backend
├── jobs/
│   └── document-ingestion/  # Python job for processing documents
└── infrastructure/          # Terraform (Azure)
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | NextJS |
| Backend | Python FastAPI |
| Database | Azure Database for PostgreSQL Flexible Server + pgvector |
| Storage | Azure Blob Storage |
| Jobs | Azure Container Apps Jobs |
| Registry | Azure Container Registry |
| Infrastructure | Terraform (azurerm provider) |
| Chunking | [Docling Parser](https://docling.ai/) |
| Embeddings | BAAI/bge-base-en-v1.5 |

## Development

### Document Ingestion Job

```bash
cd jobs/document-ingestion
uv sync                   # Install dependencies
uv run python main.py     # Run the job
```

### Infrastructure

```bash
cd infrastructure
terraform init
terraform plan -var="subscription_id=<YOUR_SUBSCRIPTION_ID>"
terraform apply -var="subscription_id=<YOUR_SUBSCRIPTION_ID>"
```

### Database Management

Stop the PostgreSQL server to save costs when not in use:

```bash
az postgres flexible-server stop --resource-group rg-techpubsai-dev --name psql-techpubsai-dev
```

Start it again:

```bash
az postgres flexible-server start --resource-group rg-techpubsai-dev --name psql-techpubsai-dev
```

Enable pgvector after first deployment:

```sql
CREATE EXTENSION vector;
```
