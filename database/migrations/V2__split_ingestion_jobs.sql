-- Add columns to support split chunking/embedding jobs
-- parent_job_id: Links embedding jobs to their parent chunking job
-- chunk_start_index, chunk_end_index: Defines chunk range for embedding jobs

ALTER TABLE document_jobs
ADD COLUMN parent_job_id BIGINT REFERENCES document_jobs(id),
ADD COLUMN chunk_start_index INT,
ADD COLUMN chunk_end_index INT;

-- Index for finding child jobs of a parent
CREATE INDEX idx_document_jobs_parent ON document_jobs(parent_job_id);

-- Index for finding chunks that need embeddings (used by embedding job)
CREATE INDEX idx_document_chunks_needs_embedding
ON document_chunks(document_version_id) WHERE embedding IS NULL;
