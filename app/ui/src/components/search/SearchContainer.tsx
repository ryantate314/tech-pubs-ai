"use client";

import { useEffect, useRef, useState } from "react";
import type { ChunkResult } from "@/types/search";
import { searchDocuments } from "@/lib/api/search";
import { SearchInput } from "./SearchInput";
import { SearchResults } from "./SearchResults";

interface SearchContainerProps {
  initialQuery?: string;
}

export function SearchContainer({ initialQuery }: SearchContainerProps) {
  const [results, setResults] = useState<ChunkResult[]>([]);
  const [query, setQuery] = useState(initialQuery || "");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasAutoSearched = useRef(false);

  // Auto-search on mount if initialQuery is provided
  useEffect(() => {
    if (initialQuery && !hasAutoSearched.current) {
      hasAutoSearched.current = true;
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (searchQuery: string) => {
    setIsLoading(true);
    setError(null);
    setQuery(searchQuery);
    setHasSearched(true);

    try {
      const response = await searchDocuments({
        query: searchQuery,
        limit: 10,
        min_similarity: 0.5,
      });
      setResults(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

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
