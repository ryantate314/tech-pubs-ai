-- Baseline migration: Combined schema from initial migrations
-- This represents the complete database schema as of the Flyway integration

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Aircraft models lookup table
CREATE TABLE aircraft_models (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed aircraft models
INSERT INTO aircraft_models (code, name) VALUES
    ('sr22', 'SR22'),
    ('sr20', 'SR20'),
    ('sf50', 'SF50');

-- Categories table
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
    aircraft_model_id BIGINT REFERENCES aircraft_models(id),
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
    blob_path VARCHAR(1024),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Processing jobs table (multiple jobs per document version)
CREATE TABLE document_jobs (
    id BIGSERIAL PRIMARY KEY,
    document_version_id BIGINT NOT NULL REFERENCES document_versions(id),
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
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
    embedding vector(768),
    token_count INT,
    page_number INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_documents_category ON documents(category_id);
CREATE INDEX idx_documents_guid ON documents(guid);
CREATE INDEX idx_documents_aircraft_model ON documents(aircraft_model_id);
CREATE INDEX idx_document_versions_document ON document_versions(document_id);
CREATE INDEX idx_document_versions_guid ON document_versions(guid);
CREATE INDEX idx_document_jobs_version ON document_jobs(document_version_id);
CREATE INDEX idx_document_jobs_status ON document_jobs(status);
CREATE INDEX idx_document_chunks_version ON document_chunks(document_version_id);

-- HNSW index for fast similarity search
CREATE INDEX idx_document_chunks_embedding ON document_chunks USING hnsw (embedding vector_cosine_ops);
