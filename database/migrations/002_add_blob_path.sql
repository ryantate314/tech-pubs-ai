-- Add blob_path column to document_versions
-- Stores the path to the blob in Azure Storage (e.g., "documents/filename.pdf")
ALTER TABLE document_versions ADD COLUMN blob_path VARCHAR(1024);
