import type {
  DocumentDetailResponse,
  DocumentDownloadUrlResponse,
  DocumentListResponse,
} from "@/types/documents";
import { apiRequest } from "./client";

export async function fetchDocuments(): Promise<DocumentListResponse> {
  return apiRequest<DocumentListResponse>("/api/documents");
}

export async function fetchDocument(guid: string): Promise<DocumentDetailResponse> {
  return apiRequest<DocumentDetailResponse>(`/api/documents/${guid}`);
}

export async function fetchDocumentDownloadUrl(
  guid: string
): Promise<DocumentDownloadUrlResponse> {
  return apiRequest<DocumentDownloadUrlResponse>(`/api/documents/${guid}/download-url`);
}
