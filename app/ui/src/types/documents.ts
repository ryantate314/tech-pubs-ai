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
  aircraft_model_name: string | null;
  latest_job_status: DocumentJobStatus | null;
  serial_ranges: SerialRangeResponse[];
  created_at: string;
}

export interface DocumentListResponse {
  documents: DocumentListItem[];
  total: number;
}

export interface DocumentVersionDetail {
  guid: string;
  file_name: string;
  name: string;
  content_type: string | null;
  file_size: number | null;
  blob_path: string | null;
}

export type SerialRangeType = "single" | "range" | "and_subs";

export interface SerialRangeResponse {
  id: number;
  range_type: SerialRangeType;
  serial_start: string;
  serial_end: string | null;
}

export interface DocumentDetailResponse {
  guid: string;
  name: string;
  aircraft_model_id: number | null;
  aircraft_model_name: string | null;
  document_category_id: number | null;
  document_category_name: string | null;
  document_type_id: number | null;
  document_type_name: string | null;
  latest_version: DocumentVersionDetail | null;
  serial_ranges: SerialRangeResponse[];
}

export interface SerialRangeInput {
  range_type: SerialRangeType;
  serial_start: string;
  serial_end?: string;
}

export interface DocumentUpdateRequest {
  name?: string;
  document_category_id?: number;
  document_type_id?: number;
  serial_ranges?: SerialRangeInput[];
}

export interface DocumentDownloadUrlResponse {
  download_url: string;
  version_name: string;
  file_name: string;
  file_size: number | null;
  content_type: string | null;
}
