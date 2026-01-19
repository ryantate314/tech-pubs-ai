# Database

## Migrations

Migrations are managed using [Flyway](https://flywaydb.org/) via Docker.

### Setup

```bash
cp database/.env.example database/.env
# Edit database/.env with your credentials
```

### Commands

```bash
make db-info      # Show migration status
make db-migrate   # Run pending migrations
make db-validate  # Validate applied migrations match files
make db-repair    # Repair schema history after failed migrations
make db-baseline  # Baseline existing database at V1
make db-add       # Adds a new empty migration
```

### Baselining an Existing Database

For databases that already have the schema applied (e.g., the dev database), run:

```bash
make db-baseline  # Marks V1 as already applied
make db-info      # Verify - should show V1 as "Baseline"
```

### Creating New Migrations

Create new files following Flyway's naming convention:

```
database/migrations/V2__description_here.sql
database/migrations/V3__another_change.sql
```

Then run:

```bash
make db-migrate
```

---

# Data Model

# Document
- Id (int64)
- Guid (unique identifier)
- Name
- CategoryId (int64 Foreign Key)
- CreatedAt (timestamp)
- UpdatedAt (timestamp)
- DeletedAt (timestamp, nullable)

# DocumentVersion
- Id (int64)
- Guid (unique identifier)
- Name
- FileName
- DocumentId (int64 Foreign Key)
- ContentType (varchar)
- FileSize (int64)
- BlobPath (varchar, nullable) - Path to blob in Azure Storage (e.g., "documents/filename.pdf")
- CreatedAt (timestamp)
- UpdatedAt (timestamp)
- DeletedAt (timestamp, nullable)

# DocumentJob
- Id (int64)
- DocumentVersionId (int64 Foreign Key)
- JobType (varchar) - 'text_extraction', 'embedding', 'thumbnail', etc.
- Status (varchar) - 'pending', 'running', 'completed', 'failed'
- ErrorMessage (text, nullable)
- StartedAt (timestamp, nullable)
- CompletedAt (timestamp, nullable)
- CreatedAt (timestamp)
- UpdatedAt (timestamp)

# DocumentChunk
- Id (int64)
- DocumentVersionId (int64 Foreign Key)
- ChunkIndex (int)
- Content (text)
- Embedding (vector(768)) - BAAI/bge-base-en-v1.5 embeddings
- TokenCount (int, nullable)
- PageNumber (int, nullable)
- CreatedAt (timestamp)

# Category
- Id (int64)
- Name
- CreatedAt (timestamp)
- UpdatedAt (timestamp)
- DeletedAt (timestamp, nullable)
