import type {
  DocumentDetailResponse,
  DocumentDownloadUrlResponse,
  DocumentListResponse,
  DocumentUpdateRequest,
  ReprocessResponse,
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

export async function updateDocument(
  guid: string,
  data: DocumentUpdateRequest
): Promise<DocumentDetailResponse> {
  return apiRequest<DocumentDetailResponse>(`/api/documents/${guid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteDocument(guid: string): Promise<void> {
  const response = await fetch(`/api/documents/${guid}`, { method: "DELETE" });
  if (!response.ok) {
    let message = response.statusText;
    try {
      const errorData = await response.json();
      message = errorData.error || errorData.detail || message;
    } catch {
      // Ignore JSON parsing errors
    }
    throw new Error(message);
  }
}

export async function reprocessDocument(guid: string): Promise<ReprocessResponse> {
  return apiRequest<ReprocessResponse>(`/api/documents/${guid}/reprocess`, {
    method: "POST",
  });
}
