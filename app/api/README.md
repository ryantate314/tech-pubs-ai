# Tech Pubs API

A Python FastAPI providing a back-end to the UI.

## Prerequisites

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) package manager
- Node.js 18+ (for UI)

## Running the API

1. Install dependencies:
   ```bash
   cd app/api
   uv sync
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

   Required variables:
   - `STORAGE_ACCOUNT_URL` - Azure Blob Storage URL (e.g., `https://account.blob.core.windows.net`)
   - `STORAGE_QUEUE_URL` - Azure Queue Storage URL (e.g., `https://account.queue.core.windows.net`)
   - `QUEUE_NAME` - Queue name for document ingestion jobs
   - `DATABASE_URL` - PostgreSQL connection string

3. Start the development server:
   ```bash
   uv run uvicorn main:app --reload
   ```

   The API will be available at http://localhost:8000

## Running the UI

1. Install dependencies:
   ```bash
   cd app/ui
   npm install
   ```

2. Configure environment variables:
   ```bash
   # Create .env.local
   echo "API_URL=http://localhost:8000" > .env.local
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The UI will be available at http://localhost:3000

## API Endpoints

- `GET /api/aircraft-models` - List aircraft models
- `GET /api/categories` - List document categories
- `POST /api/uploads/request-url` - Request a presigned URL for file upload
- `POST /api/uploads/complete` - Complete upload and queue ingestion job
