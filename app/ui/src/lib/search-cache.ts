import type { ChunkResult } from "@/types/search";

interface CachedSearchResult {
  query: string;
  results: ChunkResult[];
  timestamp: number;
}

const CACHE_KEY = "search-results-cache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function getCachedResults(query: string): ChunkResult[] | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CachedSearchResult = JSON.parse(cached);
    if (data.query !== query) return null;
    if (Date.now() - data.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data.results;
  } catch {
    return null;
  }
}

export function setCachedResults(query: string, results: ChunkResult[]): void {
  if (typeof window === "undefined") return;

  try {
    const data: CachedSearchResult = { query, results, timestamp: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Storage quota exceeded - fail silently
  }
}
