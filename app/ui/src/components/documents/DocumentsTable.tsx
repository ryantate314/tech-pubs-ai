"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatSerialRanges } from "@/lib/formatters";
import type { DocumentListItem } from "@/types/documents";
import { DocumentStatusIndicator } from "./DocumentStatusIndicator";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface DocumentsTableProps {
  documents: DocumentListItem[];
  onEdit: (doc: DocumentListItem) => void;
  onDelete: (guid: string) => Promise<void>;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function DocumentsTable({ documents, onEdit, onDelete }: DocumentsTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }

    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openMenuId]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTarget.guid);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No documents found
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
        <thead className="bg-zinc-50 dark:bg-zinc-800/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Document Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Aircraft Model
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Serial Numbers
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Created
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Status
            </th>
            <th className="w-12 px-4 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {documents.map((doc, index) => (
            <tr
              key={doc.id}
              className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/documents/${doc.guid}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {doc.name}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                {doc.aircraft_model_name ?? "-"}
              </td>
              <td className="max-w-xs px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                {formatSerialRanges(doc.serial_ranges)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                {formatDate(doc.created_at)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <DocumentStatusIndicator status={doc.latest_job_status} />
              </td>
              <td className="relative whitespace-nowrap px-4 py-3 text-right">
                <div ref={openMenuId === doc.guid ? menuRef : undefined}>
                  <button
                    onClick={() =>
                      setOpenMenuId(openMenuId === doc.guid ? null : doc.guid)
                    }
                    className="cursor-pointer rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                    aria-label="Actions"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                  {openMenuId === doc.guid && (
                    <div
                      className={`absolute right-4 z-10 w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800 ${
                        index >= documents.length - 2
                          ? "bottom-full mb-1"
                          : "top-full mt-1"
                      }`}
                    >
                      <button
                        type="button"
                        className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        onClick={() => {
                          setOpenMenuId(null);
                          onEdit(doc);
                        }}
                      >
                        Edit
                      </button>
                      <Link
                        href={`/admin/upload?documentGuid=${doc.guid}`}
                        className="block px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700"
                        onClick={() => setOpenMenuId(null)}
                      >
                        Upload New Version
                      </Link>
                      <button
                        type="button"
                        className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-red-600 hover:bg-zinc-100 dark:text-red-400 dark:hover:bg-zinc-700"
                        onClick={() => {
                          setOpenMenuId(null);
                          setDeleteTarget(doc);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel={isDeleting ? "Deleting..." : "Delete"}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
