-- Add total_token_count to document_versions for LLM cost estimation
ALTER TABLE document_versions ADD COLUMN total_token_count INTEGER;
