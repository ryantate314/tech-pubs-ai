"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DocumentListItem } from "@/types/documents";
import type { DocumentCategory, DocumentType } from "@/types/wizard";
import {
  fetchDocumentCategories,
  fetchDocumentTypes,
  fetchFilteredDocuments,
} from "@/lib/api/wizard";
import { TopBar } from "@/components/browser/TopBar";
import { ContentHeader } from "@/components/browser/ContentHeader";
import { DocumentCardGrid } from "@/components/browser/DocumentCardGrid";
import { BrowseDocumentTable } from "@/components/browser/BrowseDocumentTable";
import { Pagination } from "@/components/browser/Pagination";
import { Sidebar } from "@/components/browser/Sidebar";

const CARDS_PER_PAGE = 12;
const ROWS_PER_PAGE = 20;

export default function Home() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [sortBy, setSortBy] = useState("date-desc");
  const [currentPage, setCurrentPage] = useState(1);

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [documentTypesLoading, setDocumentTypesLoading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedDocumentTypeId, setSelectedDocumentTypeId] = useState<number | null>(null);

  // Read localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    const storedView = localStorage.getItem("aerodocs-view-mode");
    if (storedView === "card" || storedView === "table") {
      setViewMode(storedView);
    }
    const storedSidebar = localStorage.getItem("aerodocs-sidebar-collapsed");
    if (storedSidebar === "true") {
      setSidebarCollapsed(true);
    }
  }, []);

  // Load categories on mount
  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const data = await fetchDocumentCategories();
      setCategories(data);
    } catch {
      // Categories failing to load is non-critical — dropdowns will be empty
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Load document types when category changes
  useEffect(() => {
    if (selectedCategoryId === null) {
      setDocumentTypes([]);
      return;
    }

    let cancelled = false;

    async function loadTypes() {
      try {
        setDocumentTypesLoading(true);
        const data = await fetchDocumentTypes(selectedCategoryId!);
        if (!cancelled) {
          setDocumentTypes(data);
        }
      } catch {
        if (!cancelled) {
          setDocumentTypes([]);
        }
      } finally {
        if (!cancelled) {
          setDocumentTypesLoading(false);
        }
      }
    }

    loadTypes();

    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId]);

  // Load documents (with filters)
  const loadDocuments = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await fetchFilteredDocuments({
        documentCategoryId: selectedCategoryId ?? undefined,
        documentTypeId: selectedDocumentTypeId ?? undefined,
      });
      setDocuments(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId, selectedDocumentTypeId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategoryId, selectedDocumentTypeId]);

  const handleViewModeChange = useCallback((mode: "card" | "table") => {
    setViewMode(mode);
    setCurrentPage(1);
    localStorage.setItem("aerodocs-view-mode", mode);
  }, []);

  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
    setCurrentPage(1);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("aerodocs-sidebar-collapsed", String(next));
      return next;
    });
  }, []);

  const handleCategoryChange = useCallback((id: number | null) => {
    setSelectedCategoryId(id);
    setSelectedDocumentTypeId(null);
  }, []);

  const handleDocumentTypeChange = useCallback((id: number | null) => {
    setSelectedDocumentTypeId(id);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedCategoryId(null);
    setSelectedDocumentTypeId(null);
  }, []);

  const hasActiveFilters = selectedCategoryId !== null || selectedDocumentTypeId !== null;

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
      <div className="mx-auto max-w-7xl px-4 py-6">
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

        <div className="flex gap-6">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
            categories={categories}
            categoriesLoading={categoriesLoading}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={handleCategoryChange}
            documentTypes={documentTypes}
            documentTypesLoading={documentTypesLoading}
            selectedDocumentTypeId={selectedDocumentTypeId}
            onDocumentTypeChange={handleDocumentTypeChange}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />

          <main className="min-w-0 flex-1">
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
      </div>
    </div>
  );
}
