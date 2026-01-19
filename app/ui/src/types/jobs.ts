export type JobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface Job {
  id: number;
  document_version_id: number;
  document_name: string;
  job_type: string;
  status: JobStatus;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
  pending_count: number;
  running_count: number;
  completed_count: number;
  failed_count: number;
  cancelled_count: number;
}

export interface JobActionResponse {
  success: boolean;
  message: string;
  job: Job;
}
