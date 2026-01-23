"use client";

import { useCallback, useEffect, useState } from "react";
import type { Generation, Platform } from "@/types/wizard";
import { fetchGenerations } from "@/lib/api/wizard";

interface GenerationSelectorProps {
  platform: Platform;
  onSelect: (generation: Generation) => void;
  onBack: () => void;
}

export function GenerationSelector({
  platform,
  onSelect,
  onBack,
}: GenerationSelectorProps) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGenerations = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchGenerations(platform.id);
      setGenerations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load generations");
    } finally {
      setLoading(false);
    }
  }, [platform.id]);

  useEffect(() => {
    loadGenerations();
  }, [loadGenerations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading generations...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
        <button
          onClick={onBack}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
            Select Generation
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            for {platform.name}
          </p>
        </div>
        <button
          onClick={onBack}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          ← Back
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
        {generations.map((generation) => (
          <button
            key={generation.id}
            onClick={() => onSelect(generation)}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-center transition-all hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-500"
          >
            <span className="text-lg font-semibold text-zinc-900 dark:text-white">
              {generation.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
