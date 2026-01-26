import type { ChunkResult } from "@/types/search";
import { SearchResultCard } from "./SearchResultCard";

interface SearchResultsProps {
  results: ChunkResult[];
  query: string;
  isLoading: boolean;
  hasSearched: boolean;
}

export function SearchResults({
  results,
  query,
  isLoading,
  hasSearched,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-400" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Searching documents...
          </p>
        </div>
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Enter a search query to find relevant document content.
          </p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-900 dark:text-white">
            No results found
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            No document chunks match &quot;{query}&quot;. Try different keywords
            or adjust your filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Found {results.length} result{results.length !== 1 ? "s" : ""} for
        &quot;{query}&quot;
      </p>
      <div className="space-y-3">
        {results.map((result) => (
          <SearchResultCard key={result.id} result={result} />
        ))}
      </div>
    </div>
  );
}
