"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { DocumentListItem } from "@/types/documents";
import type { Platform, Generation, DocumentCategory, DocumentType } from "@/types/wizard";
import { fetchFilteredDocuments, fetchDocumentTypes } from "@/lib/api/wizard";

const PAGE_SIZE = 10;

interface WizardResultsProps {
  platform: Platform;
  generation: Generation;
  category: DocumentCategory;
  selectedTypeId: number | null;
  onTypeFilterChange: (typeId: number | null) => void;
  onBack: () => void;
  onStartOver: () => void;
}

export function WizardResults({
  platform,
  generation,
  category,
  selectedTypeId,
  onTypeFilterChange,
  onBack,
  onStartOver,
}: WizardResultsProps) {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);

  // Load document types for chip filter
  useEffect(() => {
    let cancelled = false;

    async function loadTypes() {
      try {
        setTypesLoading(true);
        const types = await fetchDocumentTypes(category.id);
        if (!cancelled) {
          setDocumentTypes(types);
        }
      } catch {
        // Graceful degradation - show documents without chips
        if (!cancelled) {
          setDocumentTypes([]);
        }
      } finally {
        if (!cancelled) {
          setTypesLoading(false);
        }
      }
    }

    loadTypes();
    return () => {
      cancelled = true;
    };
  }, [category.id]);

  // Load documents (re-fetches when type filter changes)
  const loadDocuments = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchFilteredDocuments({
        platformId: platform.id,
        generationId: generation.id,
        documentTypeId: selectedTypeId ?? undefined,
      });
      setDocuments(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [platform.id, generation.id, selectedTypeId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTypeId]);

  // Pagination calculations
  const totalPages = Math.ceil(documents.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, documents.length);
  const paginatedDocuments = documents.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
          ))}
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
              <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-700" />
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
          onClick={onStartOver}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Start Over
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4" aria-label="Search results">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
            Results
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {platform.name} {generation.name} - {category.name}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            &larr; Back
          </button>
          <button
            onClick={onStartOver}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Start Over
          </button>
        </div>
      </div>

      {/* Document type chip filter */}
      {typesLoading ? (
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
          ))}
        </div>
      ) : documentTypes.length > 0 ? (
        <div role="group" aria-label="Filter by document type" className="flex flex-wrap gap-2">
          <button
            onClick={() => onTypeFilterChange(null)}
            aria-pressed={selectedTypeId === null}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              selectedTypeId === null
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
            }`}
          >
            All
          </button>
          {documentTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => onTypeFilterChange(type.id)}
              aria-pressed={selectedTypeId === type.id}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                selectedTypeId === type.id
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
              }`}
            >
              {type.name}
            </button>
          ))}
        </div>
      ) : null}

      {documents.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-800">
          <p className="text-lg font-medium text-zinc-900 dark:text-white">
            No documents found
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {selectedTypeId
              ? "No documents found for this type. Try selecting a different type or \"All\"."
              : "No documents match your selection. Try a different platform, generation, or category."}
          </p>
          {selectedTypeId ? (
            <button
              onClick={() => onTypeFilterChange(null)}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Show All Types
            </button>
          ) : (
            <button
              onClick={onStartOver}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Start Over
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {documents.length > PAGE_SIZE
              ? `Showing ${startIndex + 1}\u2013${endIndex} of ${documents.length} documents`
              : `${documents.length} document${documents.length !== 1 ? "s" : ""} found`}
          </p>
          <div role="list" className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-700 dark:border-zinc-700 dark:bg-zinc-800">
            {paginatedDocuments.map((doc) => (
              <div
                key={doc.id}
                role="listitem"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 ${
                  currentPage === 1
                    ? "cursor-not-allowed opacity-50"
                    : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                &larr; Previous
              </button>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 ${
                  currentPage === totalPages
                    ? "cursor-not-allowed opacity-50"
                    : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
              >
                Next &rarr;
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
