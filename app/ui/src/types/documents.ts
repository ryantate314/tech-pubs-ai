export type DocumentJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface DocumentListItem {
  id: number;
  guid: string;
  name: string;
  aircraft_model_code: string | null;
  category_name: string | null;
  latest_job_status: DocumentJobStatus | null;
  created_at: string;
}

export interface DocumentListResponse {
  documents: DocumentListItem[];
  total: number;
}
