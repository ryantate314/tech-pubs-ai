-- V10__add_search_cache.sql
-- Adds caching tables for semantic search

-- Embedding cache (deterministic, long TTL)
CREATE TABLE embedding_cache (
    text_hash TEXT PRIMARY KEY,
    embedding vector(1536) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_embedding_cache_expires ON embedding_cache(expires_at);

-- Search result cache
CREATE TABLE search_cache (
    cache_key TEXT PRIMARY KEY,
    query_text TEXT NOT NULL,
    response JSONB NOT NULL,
    corpus_version TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_search_cache_expires ON search_cache(expires_at);
CREATE INDEX idx_search_cache_corpus_version ON search_cache(corpus_version);

-- Corpus version tracking (single row table)
CREATE TABLE corpus_version (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    version TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initialize with a starting version
INSERT INTO corpus_version (version) VALUES ('initial');
