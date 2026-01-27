import type { JobStatus } from "./jobs";

export interface Chunk {
  id: number;
  chunk_index: number;
  content_preview: string;
  has_embedding: boolean;
  embedding_model: string | null;
  token_count: number | null;
  page_number: number | null;
  chapter_title: string | null;
}

export interface JobSummary {
  id: number;
  job_type: string;
  status: JobStatus;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  chunk_start_index: number | null;
  chunk_end_index: number | null;
}

export interface DocumentChunksResponse {
  document_guid: string;
  document_name: string;
  version_guid: string;
  version_name: string;
  total_chunks: number;
  embedded_chunks: number;
  total_tokens: number;
  embedding_model: string | null;
  chunks: Chunk[];
  jobs: JobSummary[];
  page: number;
  page_size: number;
  total_pages: number;
}
