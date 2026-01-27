-- ============================================
-- V4__add_wizard_tables.sql
-- Adds document filter wizard tables and seed data
-- ============================================

-- ---------------------------------------------
-- 1. PLATFORMS
-- ---------------------------------------------
CREATE TABLE platforms (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO platforms (code, name, description, display_order) VALUES
    ('SR2X', 'SR2X (SR20/SR22)', 'Cirrus SR20 and SR22 piston aircraft family', 1),
    ('SF50', 'SF50 (Vision Jet)', 'Cirrus SF50 Vision Jet', 2);

-- ---------------------------------------------
-- 2. GENERATIONS (depends on platforms)
-- ---------------------------------------------
CREATE TABLE generations (
    id BIGSERIAL PRIMARY KEY,
    platform_id BIGINT NOT NULL REFERENCES platforms(id),
    code VARCHAR(10) NOT NULL,
    name VARCHAR(50) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform_id, code)
);

-- SR2X generations
INSERT INTO generations (platform_id, code, name, display_order)
SELECT p.id, g.code, g.name, g.display_order
FROM platforms p
CROSS JOIN (VALUES
    ('G1', 'Generation 1', 1),
    ('G2', 'Generation 2', 2),
    ('G3', 'Generation 3', 3),
    ('G4', 'Generation 4', 4),
    ('G5', 'Generation 5', 5),
    ('G6', 'Generation 6', 6),
    ('G7', 'Generation 7', 7)
) AS g(code, name, display_order)
WHERE p.code = 'SR2X';

-- SF50 generations
INSERT INTO generations (platform_id, code, name, display_order)
SELECT p.id, g.code, g.name, g.display_order
FROM platforms p
CROSS JOIN (VALUES
    ('G1', 'Generation 1', 1),
    ('G2', 'Generation 2', 2),
    ('G2+', 'Generation 2+', 3)
) AS g(code, name, display_order)
WHERE p.code = 'SF50';

-- ---------------------------------------------
-- 3. DOCUMENT CATEGORIES
-- ---------------------------------------------
CREATE TABLE document_categories (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO document_categories (code, name, description, display_order) VALUES
    ('service', 'Service Publications', 'Maintenance and service documentation', 1),
    ('pilot', 'Pilot Publications', 'Pilot operating documentation', 2),
    ('other', 'Other', 'Miscellaneous documentation', 3),
    ('temp', 'Temporary Revisions', 'Temporary revision documents', 4);

-- ---------------------------------------------
-- 4. DOCUMENT TYPES (depends on document_categories)
-- ---------------------------------------------
CREATE TABLE document_types (
    id BIGSERIAL PRIMARY KEY,
    document_category_id BIGINT NOT NULL REFERENCES document_categories(id),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Publications
INSERT INTO document_types (document_category_id, code, name, display_order)
SELECT dc.id, dt.code, dt.name, dt.display_order
FROM document_categories dc
CROSS JOIN (VALUES
    ('AMM', 'Airplane Maintenance Manual', 1),
    ('IPC', 'Illustrated Parts Catalog', 2),
    ('WM', 'Wiring Manual', 3),
    ('SB', 'Service Bulletin', 4),
    ('SA', 'Service Advisory', 5),
    ('CCMM', 'CAPS CMM', 6),
    ('FIM', 'Fault Isolation Manual', 7),
    ('LAG', 'Labor Allowance Guide', 8)
) AS dt(code, name, display_order)
WHERE dc.code = 'service';

-- Pilot Publications
INSERT INTO document_types (document_category_id, code, name, display_order)
SELECT dc.id, dt.code, dt.name, dt.display_order
FROM document_categories dc
CROSS JOIN (VALUES
    ('POH', 'Pilot''s Operating Handbook', 1),
    ('AFM', 'Airplane Flight Manual', 2),
    ('PIM', 'Pilot''s Information Manual', 3),
    ('AC', 'Abbreviated Checklist', 4),
    ('EC', 'Electronic Checklist', 5),
    ('SS', 'Startup Screen', 6)
) AS dt(code, name, display_order)
WHERE dc.code = 'pilot';

-- Other
INSERT INTO document_types (document_category_id, code, name, display_order)
SELECT dc.id, dt.code, dt.name, dt.display_order
FROM document_categories dc
CROSS JOIN (VALUES
    ('MISC', 'Miscellaneous', 1),
    ('SAPP', 'Supplement AFM/PIM/POH', 2)
) AS dt(code, name, display_order)
WHERE dc.code = 'other';

-- Temporary Revisions
INSERT INTO document_types (document_category_id, code, name, display_order)
SELECT dc.id, dt.code, dt.name, dt.display_order
FROM document_categories dc
CROSS JOIN (VALUES
    ('TRAMM', 'Temporary Revision - AMM', 1),
    ('TRIPC', 'Temporary Revision - IPC', 2),
    ('TRWM', 'Temporary Revision - WM', 3),
    ('TRCC', 'Temporary Revision - CCMM', 4),
    ('TRF', 'Temporary Revision - FIM', 5),
    ('TRAPP', 'Temporary Revision - APP', 6)
) AS dt(code, name, display_order)
WHERE dc.code = 'temp';

-- ---------------------------------------------
-- 5. ALTER DOCUMENTS TABLE
-- ---------------------------------------------
ALTER TABLE documents
    ADD COLUMN platform_id BIGINT REFERENCES platforms(id),
    ADD COLUMN generation_id BIGINT REFERENCES generations(id),
    ADD COLUMN document_type_id BIGINT REFERENCES document_types(id);

CREATE INDEX idx_documents_platform ON documents(platform_id);
CREATE INDEX idx_documents_generation ON documents(generation_id);
CREATE INDEX idx_documents_document_type ON documents(document_type_id);

-- Composite index for wizard filtering
CREATE INDEX idx_documents_wizard_filter
    ON documents(platform_id, generation_id, document_type_id)
    WHERE deleted_at IS NULL;
