"use client";

import { useCallback, useEffect, useState } from "react";
import type { Platform } from "@/types/wizard";
import { fetchPlatforms } from "@/lib/api/wizard";

interface PlatformSelectorProps {
  onSelect: (platform: Platform) => void;
}

export function PlatformSelector({ onSelect }: PlatformSelectorProps) {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlatforms = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchPlatforms();
      setPlatforms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load platforms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlatforms();
  }, [loadPlatforms]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading platforms...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
        Select Your Aircraft Platform
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {platforms.map((platform) => (
          <button
            key={platform.id}
            onClick={() => onSelect(platform)}
            className="flex flex-col items-start rounded-xl border border-zinc-200 bg-white p-6 text-left transition-all hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-500"
          >
            <span className="text-xl font-semibold text-zinc-900 dark:text-white">
              {platform.name}
            </span>
            <span className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {platform.code}
            </span>
            {platform.description && (
              <span className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                {platform.description}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
