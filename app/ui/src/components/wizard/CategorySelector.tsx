"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DocumentCategory, Platform, Generation } from "@/types/wizard";
import { fetchDocumentCategories } from "@/lib/api/wizard";

interface CategorySelectorProps {
  platform: Platform;
  generation: Generation;
  onSelect: (category: DocumentCategory) => void;
  onBack: () => void;
}

export function CategorySelector({
  platform,
  generation,
  onSelect,
  onBack,
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const loadCategories = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchDocumentCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const grid = gridRef.current;
      if (!grid) return;

      const buttons = Array.from(grid.querySelectorAll<HTMLButtonElement>("button"));
      const currentIndex = buttons.findIndex((btn) => btn === document.activeElement);
      if (currentIndex === -1) return;

      let nextIndex: number | null = null;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          nextIndex = (currentIndex + 1) % buttons.length;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
          break;
      }

      if (nextIndex !== null) {
        buttons[nextIndex].focus();
      }
    },
    []
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-xl border border-zinc-200 p-6 dark:border-zinc-700">
              <div className="h-6 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="mt-2 h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          ))}
        </div>
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
            Select Document Category
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {platform.name} {generation.name}
          </p>
        </div>
        <button
          onClick={onBack}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          ← Back
        </button>
      </div>
      <div
        ref={gridRef}
        role="listbox"
        aria-label="Select document category"
        className="grid gap-4 sm:grid-cols-2"
        onKeyDown={handleKeyDown}
      >
        {categories.map((category, index) => (
          <button
            key={category.id}
            role="option"
            aria-selected={false}
            tabIndex={index === 0 ? 0 : -1}
            onClick={() => onSelect(category)}
            className="flex flex-col items-start rounded-xl border border-zinc-200 bg-white p-6 text-left transition-all hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-500"
          >
            <span className="text-lg font-semibold text-zinc-900 dark:text-white">
              {category.name}
            </span>
            {category.description && (
              <span className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                {category.description}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
