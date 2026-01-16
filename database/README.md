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
