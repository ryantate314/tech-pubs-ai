"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DocumentListItem } from "@/types/documents";
import { fetchDocuments } from "@/lib/api/documents";
import { TopBar } from "@/components/browser/TopBar";
import { ContentHeader } from "@/components/browser/ContentHeader";
import { DocumentCardGrid } from "@/components/browser/DocumentCardGrid";
import { BrowseDocumentTable } from "@/components/browser/BrowseDocumentTable";
import { Pagination } from "@/components/browser/Pagination";

const CARDS_PER_PAGE = 12;
const ROWS_PER_PAGE = 20;

export default function Home() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [sortBy, setSortBy] = useState("date-desc");
  const [currentPage, setCurrentPage] = useState(1);

  // Read localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    const stored = localStorage.getItem("aerodocs-view-mode");
    if (stored === "card" || stored === "table") {
      setViewMode(stored);
    }
  }, []);

  const loadDocuments = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
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

  const handleViewModeChange = useCallback((mode: "card" | "table") => {
    setViewMode(mode);
    setCurrentPage(1);
    localStorage.setItem("aerodocs-view-mode", mode);
  }, []);

  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
    setCurrentPage(1);
  }, []);

  const sortedDocuments = useMemo(() => {
    const sorted = [...documents];
    switch (sortBy) {
      case "date-desc":
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "date-asc":
        sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "name-asc":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }
    return sorted;
  }, [documents, sortBy]);

  const itemsPerPage = viewMode === "card" ? CARDS_PER_PAGE : ROWS_PER_PAGE;
  const totalPages = Math.max(1, Math.ceil(sortedDocuments.length / itemsPerPage));

  const paginatedDocuments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedDocuments.slice(start, start + itemsPerPage);
  }, [sortedDocuments, currentPage, itemsPerPage]);

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <TopBar />
      <main className="mx-auto max-w-7xl px-4 py-6">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              <button
                onClick={loadDocuments}
                className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 dark:border-red-800 dark:bg-red-950 dark:text-red-200 dark:hover:bg-red-900"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Loading documents...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <ContentHeader
              documentCount={documents.length}
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              sortBy={sortBy}
              onSortChange={handleSortChange}
            />
            {viewMode === "card" ? (
              <DocumentCardGrid documents={paginatedDocuments} />
            ) : (
              <BrowseDocumentTable documents={paginatedDocuments} />
            )}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </main>
    </div>
  );
}
