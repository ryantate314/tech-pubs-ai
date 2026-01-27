-- Update embedding dimension from 768 to 1536 for text-embedding-3-small
-- All existing embeddings must be regenerated

-- Drop the vector similarity index first
DROP INDEX IF EXISTS idx_document_chunks_embedding;

-- Set all existing embeddings to NULL (they need to be regenerated)
UPDATE document_chunks SET embedding = NULL;

-- Alter the column to use the new dimension
ALTER TABLE document_chunks
    ALTER COLUMN embedding TYPE vector(1536);

-- Recreate the index
CREATE INDEX idx_document_chunks_embedding ON document_chunks
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
