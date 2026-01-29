export interface SearchRequest {
  query: string;
  limit?: number;
  min_similarity?: number;
}

export interface ChunkResult {
  id: number;
  content: string;
  summary: string;
  page_number: number | null;
  chapter_title: string | null;
  document_guid: string;
  document_name: string;
  aircraft_model_name: string | null;
  similarity: number;
}

export interface SearchResponse {
  query: string;
  results: ChunkResult[];
  total_found: number;
}
