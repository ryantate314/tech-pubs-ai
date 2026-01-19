-- Create aircraft_models lookup table
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

-- Add aircraft_model_id foreign key to documents
ALTER TABLE documents ADD COLUMN aircraft_model_id BIGINT REFERENCES aircraft_models(id);

-- Create index for the foreign key
CREATE INDEX idx_documents_aircraft_model ON documents(aircraft_model_id);
