-- Add embedding_model column to track which model generated each embedding
ALTER TABLE document_chunks
    ADD COLUMN embedding_model VARCHAR(100);

-- Add index for querying by model (useful for re-embedding specific models)
CREATE INDEX idx_document_chunks_embedding_model ON document_chunks (embedding_model);
