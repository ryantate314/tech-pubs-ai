import type { Category } from "@/types/categories";
import { apiRequest } from "./client";

export async function fetchCategories(): Promise<Category[]> {
  return apiRequest<Category[]>("/api/categories");
}
