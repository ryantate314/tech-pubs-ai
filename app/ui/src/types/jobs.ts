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

export interface QueueActionResponse {
  success: boolean;
  message: string;
  messages_cleared: number;
}

// Hierarchical job types
export interface ChildJobCounts {
  total: number;
  completed: number;
  failed: number;
}

export interface ParentJob {
  id: number;
  document_version_id: number;
  document_name: string;
  document_version: string;
  job_type: string;
  status: JobStatus;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  child_job_counts: ChildJobCounts;
}

export interface ChildJob {
  id: number;
  job_type: string;
  status: JobStatus;
  error_message: string | null;
  chunk_start_index: number | null;
  chunk_end_index: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParentJobListResponse {
  jobs: ParentJob[];
  total: number;
  pending_count: number;
  running_count: number;
  completed_count: number;
  failed_count: number;
  cancelled_count: number;
}

export interface JobDetailResponse {
  parent_job: ParentJob;
  child_jobs: ChildJob[];
}
