export interface UploadUrlRequest {
  filename: string;
  content_type: string;
  file_size: number;
  document_name: string;
  aircraft_model_id: number;
  category_id: number;
<<<<<<< HEAD
  platform_id?: number;
  generation_id?: number;
  document_type_id?: number;
=======
  version_name: string;
  document_guid?: string;
>>>>>>> 834d0a238fe3be78e3126c08e8f0631420ae1044
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
  category_id: number;
<<<<<<< HEAD
  platform_id?: number;
  generation_id?: number;
  document_type_id?: number;
=======
  version_name: string;
  document_guid?: string;
>>>>>>> 834d0a238fe3be78e3126c08e8f0631420ae1044
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
