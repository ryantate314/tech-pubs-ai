"use client";

import { useCallback, useEffect, useState } from "react";
import type { DocumentType, DocumentCategory, Platform, Generation } from "@/types/wizard";
import { fetchDocumentTypes } from "@/lib/api/wizard";

interface TypeSelectorProps {
  platform: Platform;
  generation: Generation;
  category: DocumentCategory;
  onSelect: (type: DocumentType) => void;
  onBack: () => void;
}

export function TypeSelector({
  platform,
  generation,
  category,
  onSelect,
  onBack,
}: TypeSelectorProps) {
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTypes = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchDocumentTypes(category.id);
      setTypes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load document types");
    } finally {
      setLoading(false);
    }
  }, [category.id]);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading document types...
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
            Select Document Type
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {platform.name} {generation.name} - {category.name}
          </p>
        </div>
        <button
          onClick={onBack}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          ← Back
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {types.map((type) => (
          <button
            key={type.id}
            onClick={() => onSelect(type)}
            className="flex flex-col items-start rounded-lg border border-zinc-200 bg-white p-4 text-left transition-all hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-500"
          >
            <span className="font-semibold text-zinc-900 dark:text-white">
              {type.code}
            </span>
            <span className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {type.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
