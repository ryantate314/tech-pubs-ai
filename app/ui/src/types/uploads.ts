export type SerialRangeType = "single" | "range" | "and_subs";

export interface SerialRangeInput {
  range_type: SerialRangeType;
  serial_start: string;
  serial_end?: string;
}

export interface UploadUrlRequest {
  filename: string;
  content_type: string;
  file_size: number;
  document_name: string;
  aircraft_model_id: number;
  platform_id?: number;
  generation_id?: number;
  document_type_id?: number;
  version_name: string;
  document_guid?: string;
  serial_ranges?: SerialRangeInput[];
}

export interface UploadUrlResponse {
  upload_url: string;
  blob_path: string;
}

export interface UploadCompleteRequest {
  blob_path: string;
  document_name: string;
  filename: string;
  content_type: string;
  file_size: number;
  aircraft_model_id: number;
  platform_id?: number;
  generation_id?: number;
  document_type_id?: number;
  version_name: string;
  document_guid?: string;
  serial_ranges?: SerialRangeInput[];
}

export interface UploadCompleteResponse {
  document_id: number;
  job_id: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export type UploadStatus =
  | "idle"
  | "requesting-url"
  | "uploading"
  | "completing"
  | "success"
  | "error";
