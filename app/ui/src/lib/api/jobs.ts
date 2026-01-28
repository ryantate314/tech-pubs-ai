import type {
  JobActionResponse,
  JobDetailResponse,
  JobStatus,
  ParentJobListResponse,
  QueueActionResponse,
} from "@/types/jobs";
import { apiRequest } from "./client";

export interface FetchJobsParams {
  status?: JobStatus;
  startDate?: string;
}

export async function fetchJobs(
  params: FetchJobsParams = {}
): Promise<ParentJobListResponse> {
  const searchParams = new URLSearchParams();

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.startDate) {
    searchParams.set("start_date", params.startDate);
  }

  const queryString = searchParams.toString();
  const endpoint = `/api/jobs${queryString ? `?${queryString}` : ""}`;

  return apiRequest<ParentJobListResponse>(endpoint);
}

export async function fetchJobDetail(jobId: number): Promise<JobDetailResponse> {
  return apiRequest<JobDetailResponse>(`/api/jobs/${jobId}`);
}

export async function cancelJob(jobId: number): Promise<JobActionResponse> {
  return apiRequest<JobActionResponse>(`/api/jobs/${jobId}/cancel`, {
    method: "POST",
  });
}

export async function requeueJob(jobId: number): Promise<JobActionResponse> {
  return apiRequest<JobActionResponse>(`/api/jobs/${jobId}/requeue`, {
    method: "POST",
  });
}

export async function clearChunkingQueue(): Promise<QueueActionResponse> {
  return apiRequest<QueueActionResponse>(`/api/jobs/queues/chunking/clear`, {
    method: "POST",
  });
}

export async function clearEmbeddingQueue(): Promise<QueueActionResponse> {
  return apiRequest<QueueActionResponse>(`/api/jobs/queues/embedding/clear`, {
    method: "POST",
  });
}
