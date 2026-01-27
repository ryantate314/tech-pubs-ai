"use client";

import { useState } from "react";
import type { AircraftModel } from "@/types/aircraft-models";

interface SearchInputProps {
  onSearch: (
    query: string,
    aircraftModelId?: number
  ) => void;
  aircraftModels: AircraftModel[];
  isLoading: boolean;
  initialQuery?: string;
}

export function SearchInput({
  onSearch,
  aircraftModels,
  isLoading,
  initialQuery,
}: SearchInputProps) {
  const [query, setQuery] = useState(initialQuery || "");
  const [aircraftModelId, setAircraftModelId] = useState<number | undefined>(
    undefined
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), aircraftModelId);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <label htmlFor="search-query" className="sr-only">
            Search query
          </label>
          <input
            id="search-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents (e.g., hydraulic system maintenance)"
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-400"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-zinc-900"
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="flex gap-4">
        <div className="w-48">
          <label
            htmlFor="aircraft-model-filter"
            className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
          >
            Aircraft Model
          </label>
          <select
            id="aircraft-model-filter"
            value={aircraftModelId ?? ""}
            onChange={(e) =>
              setAircraftModelId(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            disabled={isLoading}
          >
            <option value="">All Aircraft</option>
            {aircraftModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.code} - {model.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </form>
  );
}
