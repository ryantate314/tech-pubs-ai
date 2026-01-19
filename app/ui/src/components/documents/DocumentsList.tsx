"use client";

import { useCallback, useEffect, useState } from "react";
import type { DocumentListItem } from "@/types/documents";
import { fetchDocuments } from "@/lib/api/documents";
import { DocumentsTable } from "./DocumentsTable";

export function DocumentsList() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchDocuments();
      setDocuments(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading documents...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {documents.length} document{documents.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={loadDocuments}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Refresh
        </button>
      </div>

      <DocumentsTable documents={documents} />
    </div>
  );
}
