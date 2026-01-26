import type { Platform, Generation, DocumentCategory, DocumentType } from "@/types/wizard";
import type { DocumentListResponse } from "@/types/documents";
import { apiRequest } from "./client";

export async function fetchPlatforms(): Promise<Platform[]> {
  return apiRequest<Platform[]>("/api/platforms");
}

export async function fetchGenerations(platformId: number): Promise<Generation[]> {
  return apiRequest<Generation[]>(`/api/platforms/${platformId}/generations`);
}

export async function fetchDocumentCategories(): Promise<DocumentCategory[]> {
  return apiRequest<DocumentCategory[]>("/api/document-categories");
}

export async function fetchDocumentTypes(categoryId: number): Promise<DocumentType[]> {
  return apiRequest<DocumentType[]>(`/api/document-categories/${categoryId}/types`);
}

export interface FetchFilteredDocumentsParams {
  platformId?: number;
  generationId?: number;
  documentTypeId?: number;
  documentCategoryId?: number;
}

export async function fetchFilteredDocuments(
  params: FetchFilteredDocumentsParams
): Promise<DocumentListResponse> {
  const searchParams = new URLSearchParams();

  if (params.platformId) {
    searchParams.set("platform_id", String(params.platformId));
  }
  if (params.generationId) {
    searchParams.set("generation_id", String(params.generationId));
  }
  if (params.documentTypeId) {
    searchParams.set("document_type_id", String(params.documentTypeId));
  }
  if (params.documentCategoryId) {
    searchParams.set("document_category_id", String(params.documentCategoryId));
  }

  const queryString = searchParams.toString();
  const endpoint = `/api/documents${queryString ? `?${queryString}` : ""}`;

  return apiRequest<DocumentListResponse>(endpoint);
}

// Helper to find a single item by ID from the list endpoints
// (Used when restoring wizard state from URL params)
export async function fetchPlatformById(id: number): Promise<Platform | null> {
  const platforms = await fetchPlatforms();
  return platforms.find((p) => p.id === id) ?? null;
}

export async function fetchGenerationById(
  platformId: number,
  generationId: number
): Promise<Generation | null> {
  const generations = await fetchGenerations(platformId);
  return generations.find((g) => g.id === generationId) ?? null;
}

export async function fetchDocumentCategoryById(id: number): Promise<DocumentCategory | null> {
  const categories = await fetchDocumentCategories();
  return categories.find((c) => c.id === id) ?? null;
}

export async function fetchDocumentTypeById(
  categoryId: number,
  typeId: number
): Promise<DocumentType | null> {
  const types = await fetchDocumentTypes(categoryId);
  return types.find((t) => t.id === typeId) ?? null;
}
