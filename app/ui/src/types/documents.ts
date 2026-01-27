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
  serial_start: number;
  serial_end: number | null;
}

export interface DocumentDetailResponse {
  guid: string;
  name: string;
  aircraft_model_id: number | null;
  aircraft_model_code: string | null;
  category_id: number | null;
  category_name: string | null;
  latest_version: DocumentVersionDetail | null;
  serial_ranges: SerialRangeResponse[];
}

export interface DocumentDownloadUrlResponse {
  download_url: string;
  version_name: string;
  file_name: string;
  file_size: number | null;
  content_type: string | null;
}
