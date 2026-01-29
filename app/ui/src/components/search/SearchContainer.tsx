"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChunkResult } from "@/types/search";
import { searchDocuments } from "@/lib/api/search";
import { getCachedResults, setCachedResults } from "@/lib/search-cache";
import { SearchInput } from "./SearchInput";
import { SearchResults } from "./SearchResults";

interface SearchContainerProps {
  initialQuery?: string;
}

export function SearchContainer({ initialQuery }: SearchContainerProps) {
  const router = useRouter();
  const [results, setResults] = useState<ChunkResult[]>([]);
  const [query, setQuery] = useState(initialQuery || "");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAutoSearched = useRef(false);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      setIsLoading(true);
      setError(null);
      setQuery(searchQuery);
      setHasSearched(true);

      // Update URL with search query for back-navigation support
      const url = `/search?q=${encodeURIComponent(searchQuery)}`;
      router.push(url, { scroll: false });

      try {
        const response = await searchDocuments({
          query: searchQuery,
          limit: 10,
          min_similarity: 0.5,
        });
        setResults(response.results);
        setCachedResults(searchQuery, response.results);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  // Auto-search on mount if initialQuery is provided
  useEffect(() => {
    if (initialQuery && !hasAutoSearched.current) {
      hasAutoSearched.current = true;

      // Try cache first for instant back-navigation
      const cached = getCachedResults(initialQuery);
      if (cached) {
        setResults(cached);
        setHasSearched(true);
        return;
      }

      handleSearch(initialQuery);
    }
  }, [initialQuery, handleSearch]);

  return (
    <div className="space-y-8">
      <SearchInput
        onSearch={handleSearch}
        isLoading={isLoading}
        initialQuery={initialQuery}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <SearchResults
        results={results}
        query={query}
        isLoading={isLoading}
        hasSearched={hasSearched}
      />
    </div>
  );
}
