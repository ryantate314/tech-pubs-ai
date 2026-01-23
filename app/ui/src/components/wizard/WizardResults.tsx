"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { DocumentListItem } from "@/types/documents";
import type { Platform, Generation, DocumentType } from "@/types/wizard";
import { fetchFilteredDocuments } from "@/lib/api/wizard";

interface WizardResultsProps {
  platform: Platform;
  generation: Generation;
  type: DocumentType;
  onStartOver: () => void;
}

export function WizardResults({
  platform,
  generation,
  type,
  onStartOver,
}: WizardResultsProps) {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchFilteredDocuments({
        platformId: platform.id,
        generationId: generation.id,
        documentTypeId: type.id,
      });
      setDocuments(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [platform.id, generation.id, type.id]);

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

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
        <button
          onClick={onStartOver}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Start Over
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
            Results
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {platform.name} {generation.name} - {type.name}
          </p>
        </div>
        <button
          onClick={onStartOver}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Start Over
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-800">
          <p className="text-zinc-600 dark:text-zinc-300">
            No documents found for this selection.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {documents.length} document{documents.length !== 1 ? "s" : ""} found
          </p>
          <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-700 dark:border-zinc-700 dark:bg-zinc-800">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <Link
                    href={`/admin/documents/${doc.guid}`}
                    className="font-medium text-zinc-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                  >
                    {doc.name}
                  </Link>
                </div>
                <Link
                  href={`/admin/documents/${doc.guid}`}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
