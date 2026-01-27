"use client";

import { useCallback, useEffect, useState } from "react";
import type { DocumentDetailResponse, DocumentListItem } from "@/types/documents";
import { deleteDocument, fetchDocument, fetchDocuments } from "@/lib/api/documents";
import { DocumentsTable } from "./DocumentsTable";
import { EditDocumentModal } from "./EditDocumentModal";

export function DocumentsList() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<DocumentDetailResponse | null>(null);

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

  const handleEdit = useCallback(async (doc: DocumentListItem) => {
    try {
      setError(null);
      const detail = await fetchDocument(doc.guid);
      setEditTarget(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load document details");
    }
  }, []);

  const handleEditSuccess = useCallback((updated: DocumentDetailResponse) => {
    // Update the document in the list
    setDocuments((docs) =>
      docs.map((d) =>
        d.guid === updated.guid
          ? {
              ...d,
              name: updated.name,
              serial_ranges: updated.serial_ranges,
            }
          : d
      )
    );
  }, []);

  const handleDelete = useCallback(async (guid: string) => {
    // Optimistically remove from list
    const previousDocuments = documents;
    setDocuments((docs) => docs.filter((d) => d.guid !== guid));

    try {
      await deleteDocument(guid);
    } catch (err) {
      // Restore on error
      setDocuments(previousDocuments);
      throw err;
    }
  }, [documents]);

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

      <DocumentsTable documents={documents} onEdit={handleEdit} onDelete={handleDelete} />

      {editTarget && (
        <EditDocumentModal
          document={editTarget}
          open={true}
          onClose={() => setEditTarget(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
