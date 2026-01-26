import type { SearchRequest, SearchResponse } from "@/types/search";
import { apiRequest } from "./client";

export async function searchDocuments(
  request: SearchRequest
): Promise<SearchResponse> {
  return apiRequest<SearchResponse>("/api/search", {
    method: "POST",
    body: JSON.stringify(request),
  });
}
