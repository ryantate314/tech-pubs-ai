"use client";

import { useCallback, useEffect, useState } from "react";
import type { Category } from "@/types/categories";
import type { AircraftModel } from "@/types/aircraft-models";
import type { ChunkResult } from "@/types/search";
import { fetchCategories } from "@/lib/api/categories";
import { fetchAircraftModels } from "@/lib/api/aircraft-models";
import { searchDocuments } from "@/lib/api/search";
import { SearchInput } from "./SearchInput";
import { SearchResults } from "./SearchResults";

export function SearchContainer() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [aircraftModels, setAircraftModels] = useState<AircraftModel[]>([]);
  const [results, setResults] = useState<ChunkResult[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFilterData = useCallback(async () => {
    try {
      const [categoriesData, aircraftModelsData] = await Promise.all([
        fetchCategories(),
        fetchAircraftModels(),
      ]);
      setCategories(categoriesData);
      setAircraftModels(aircraftModelsData);
    } catch (err) {
      console.error("Failed to load filter data:", err);
    }
  }, []);

  useEffect(() => {
    loadFilterData();
  }, [loadFilterData]);

  const handleSearch = async (
    searchQuery: string,
    categoryId?: number,
    aircraftModelId?: number
  ) => {
    setIsLoading(true);
    setError(null);
    setQuery(searchQuery);
    setHasSearched(true);

    try {
      const response = await searchDocuments({
        query: searchQuery,
        category_id: categoryId,
        aircraft_model_id: aircraftModelId,
        limit: 20,
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
        categories={categories}
        aircraftModels={aircraftModels}
        isLoading={isLoading}
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
