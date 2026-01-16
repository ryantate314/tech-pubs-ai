-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Categories table (created first since documents reference it)
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Documents table
CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    guid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category_id BIGINT REFERENCES categories(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Document versions table
CREATE TABLE document_versions (
    id BIGSERIAL PRIMARY KEY,
    guid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    document_id BIGINT NOT NULL REFERENCES documents(id),
    content_type VARCHAR(50),
    file_size BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Processing jobs table (multiple jobs per document version)
CREATE TABLE document_jobs (
    id BIGSERIAL PRIMARY KEY,
    document_version_id BIGINT NOT NULL REFERENCES document_versions(id),
    job_type VARCHAR(50) NOT NULL,  -- 'text_extraction', 'embedding', 'thumbnail', etc.
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, running, completed, failed
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document chunks with embeddings
CREATE TABLE document_chunks (
    id BIGSERIAL PRIMARY KEY,
    document_version_id BIGINT NOT NULL REFERENCES document_versions(id),
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(768),  -- BAAI/bge-base-en-v1.5 dimension
    token_count INT,
    page_number INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_documents_category ON documents(category_id);
CREATE INDEX idx_documents_guid ON documents(guid);
CREATE INDEX idx_document_versions_document ON document_versions(document_id);
CREATE INDEX idx_document_versions_guid ON document_versions(guid);
CREATE INDEX idx_document_jobs_version ON document_jobs(document_version_id);
CREATE INDEX idx_document_jobs_status ON document_jobs(status);
CREATE INDEX idx_document_chunks_version ON document_chunks(document_version_id);

-- HNSW index for fast similarity search
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING hnsw (embedding vector_cosine_ops);
