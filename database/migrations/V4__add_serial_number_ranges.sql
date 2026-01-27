-- Add serial number ranges table for documents

CREATE TABLE document_serial_ranges (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    range_type VARCHAR(20) NOT NULL CHECK (range_type IN ('single', 'range', 'and_subs')),
    serial_start BIGINT NOT NULL,
    serial_end BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_serial_end_for_range CHECK (
        (range_type = 'range' AND serial_end IS NOT NULL) OR
        (range_type IN ('single', 'and_subs') AND serial_end IS NULL)
    ),
    CONSTRAINT check_range_order CHECK (
        range_type != 'range' OR serial_end >= serial_start
    )
);

CREATE INDEX idx_document_serial_ranges_document ON document_serial_ranges(document_id);
CREATE INDEX idx_document_serial_ranges_start ON document_serial_ranges(serial_start);
