"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DocumentDetailResponse, SerialRangeInput } from "@/types/documents";
import type { DocumentCategory, DocumentType } from "@/types/wizard";
import { fetchDocumentCategories, fetchDocumentTypes } from "@/lib/api/wizard";
import { updateDocument } from "@/lib/api/documents";
import { SerialRangeEditor } from "@/components/upload/SerialRangeEditor";

interface EditDocumentModalProps {
  document: DocumentDetailResponse;
  open: boolean;
  onClose: () => void;
  onSuccess: (updated: DocumentDetailResponse) => void;
}

export function EditDocumentModal({
  document,
  open,
  onClose,
  onSuccess,
}: EditDocumentModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Form state
  const [name, setName] = useState(document.name);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    document.document_category_id
  );
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(
    document.document_type_id
  );
  const [serialRanges, setSerialRanges] = useState<SerialRangeInput[]>(
    document.serial_ranges.map((sr) => ({
      range_type: sr.range_type,
      serial_start: sr.serial_start,
      serial_end: sr.serial_end ?? undefined,
    }))
  );

  // Reference data
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [types, setTypes] = useState<DocumentType[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when document changes
  useEffect(() => {
    setName(document.name);
    setSelectedCategoryId(document.document_category_id);
    setSelectedTypeId(document.document_type_id);
    setSerialRanges(
      document.serial_ranges.map((sr) => ({
        range_type: sr.range_type,
        serial_start: sr.serial_start,
        serial_end: sr.serial_end ?? undefined,
      }))
    );
    setError(null);
  }, [document]);

  // Load categories on mount
  useEffect(() => {
    if (open && categories.length === 0) {
      setLoadingCategories(true);
      fetchDocumentCategories()
        .then(setCategories)
        .catch(() => setError("Failed to load categories"))
        .finally(() => setLoadingCategories(false));
    }
  }, [open, categories.length]);

  // Load types when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      setLoadingTypes(true);
      fetchDocumentTypes(selectedCategoryId)
        .then(setTypes)
        .catch(() => setError("Failed to load document types"))
        .finally(() => setLoadingTypes(false));
    } else {
      setTypes([]);
    }
  }, [selectedCategoryId]);

  // Escape key handler
  useEffect(() => {
    if (open) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [open, onClose]);

  const handleCategoryChange = useCallback((categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
    setSelectedTypeId(null); // Clear type when category changes
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const updated = await updateDocument(document.guid, {
        name: name !== document.name ? name : undefined,
        document_category_id: selectedCategoryId ?? undefined,
        document_type_id: selectedTypeId ?? undefined,
        serial_ranges: serialRanges,
      });
      onSuccess(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update document");
    } finally {
      setSaving(false);
    }
  }, [document.guid, document.name, name, selectedCategoryId, selectedTypeId, serialRanges, onSuccess, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-dialog-title"
        className="relative z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-800"
      >
        <h2
          id="edit-dialog-title"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
        >
          Edit Document
        </h2>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="mt-6 space-y-4">
          {/* Document Name */}
          <div>
            <label
              htmlFor="doc-name"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Document Name
            </label>
            <input
              id="doc-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
            />
          </div>

          {/* Document Category */}
          <div>
            <label
              htmlFor="doc-category"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Document Category
            </label>
            <select
              id="doc-category"
              value={selectedCategoryId ?? ""}
              onChange={(e) =>
                handleCategoryChange(e.target.value ? Number(e.target.value) : null)
              }
              disabled={saving || loadingCategories}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
            >
              <option value="">Select category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Document Type */}
          <div>
            <label
              htmlFor="doc-type"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Document Type
            </label>
            <select
              id="doc-type"
              value={selectedTypeId ?? ""}
              onChange={(e) =>
                setSelectedTypeId(e.target.value ? Number(e.target.value) : null)
              }
              disabled={saving || loadingTypes || !selectedCategoryId}
              className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
            >
              <option value="">
                {!selectedCategoryId
                  ? "Select a category first"
                  : loadingTypes
                  ? "Loading..."
                  : "Select type..."}
              </option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Serial Ranges */}
          <SerialRangeEditor
            ranges={serialRanges}
            onChange={setSerialRanges}
            disabled={saving}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="cursor-pointer rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
