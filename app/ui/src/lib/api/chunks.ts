import type { DocumentChunksResponse } from "@/types/chunks";
import { apiRequest } from "./client";

export async function fetchDocumentChunks(
  guid: string,
  page: number = 1,
  pageSize: number = 50
): Promise<DocumentChunksResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("page", page.toString());
  searchParams.set("page_size", pageSize.toString());

  return apiRequest<DocumentChunksResponse>(
    `/api/documents/${guid}/chunks?${searchParams.toString()}`
  );
}
