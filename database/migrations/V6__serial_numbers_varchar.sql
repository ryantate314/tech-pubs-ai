-- Convert serial numbers from BIGINT to VARCHAR(10) to preserve leading zeros

-- Drop existing constraints
ALTER TABLE document_serial_ranges DROP CONSTRAINT IF EXISTS check_serial_end_for_range;
ALTER TABLE document_serial_ranges DROP CONSTRAINT IF EXISTS check_range_order;

-- Alter column types
ALTER TABLE document_serial_ranges
    ALTER COLUMN serial_start TYPE VARCHAR(10) USING serial_start::VARCHAR(10);
ALTER TABLE document_serial_ranges
    ALTER COLUMN serial_end TYPE VARCHAR(10) USING serial_end::VARCHAR(10);

-- Add numeric-only constraints
ALTER TABLE document_serial_ranges
    ADD CONSTRAINT check_serial_start_numeric CHECK (serial_start ~ '^[0-9]+$');
ALTER TABLE document_serial_ranges
    ADD CONSTRAINT check_serial_end_numeric CHECK (serial_end IS NULL OR serial_end ~ '^[0-9]+$');

-- Re-add range_type constraints
ALTER TABLE document_serial_ranges ADD CONSTRAINT check_serial_end_for_range CHECK (
    (range_type = 'range' AND serial_end IS NOT NULL) OR
    (range_type IN ('single', 'and_subs') AND serial_end IS NULL)
);

-- Re-add range order constraint with numeric cast
ALTER TABLE document_serial_ranges ADD CONSTRAINT check_range_order CHECK (
    range_type != 'range' OR serial_end::BIGINT >= serial_start::BIGINT
);

-- Update index for range queries
DROP INDEX IF EXISTS idx_document_serial_ranges_start;
CREATE INDEX idx_document_serial_ranges_start ON document_serial_ranges((serial_start::BIGINT));
