"use client";

import Link from "next/link";
import { useState } from "react";
import { formatSerialRanges } from "@/lib/formatters";
import type { DocumentListItem } from "@/types/documents";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DropdownMenu, DropdownMenuItem, calculateDropdownPosition } from "@/components/ui/DropdownMenu";

interface DocumentsTableProps {
  documents: DocumentListItem[];
  onEdit: (doc: DocumentListItem) => void;
  onDelete: (guid: string) => Promise<void>;
  onReprocess: (guid: string) => Promise<void>;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function DocumentsTable({ documents, onEdit, onDelete, onReprocess }: DocumentsTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; placement: "above" | "below" } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [reprocessTarget, setReprocessTarget] = useState<DocumentListItem | null>(null);
  const [isReprocessing, setIsReprocessing] = useState(false);

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

  async function handleReprocess() {
    if (!reprocessTarget) return;
    setIsReprocessing(true);
    try {
      await onReprocess(reprocessTarget.guid);
      setReprocessTarget(null);
    } finally {
      setIsReprocessing(false);
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
              Embed Status
            </th>
            <th className="w-12 px-4 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {documents.map((doc) => (
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
              <td className="whitespace-nowrap px-4 py-3 text-sm">
                <span className={
                  doc.total_chunks === 0
                    ? "text-zinc-400 dark:text-zinc-500"
                    : doc.embedded_chunks === doc.total_chunks
                      ? "text-green-600 dark:text-green-400"
                      : "text-amber-600 dark:text-amber-400"
                }>
                  {doc.embedded_chunks}/{doc.total_chunks}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <DropdownMenu
                  open={openMenuId === doc.guid}
                  position={openMenuId === doc.guid ? menuPosition : null}
                  onOpenChange={(open) => {
                    if (!open) {
                      setOpenMenuId(null);
                      setMenuPosition(null);
                    }
                  }}
                  trigger={
                    <button
                      onClick={(e) => {
                        if (openMenuId === doc.guid) {
                          setOpenMenuId(null);
                          setMenuPosition(null);
                        } else {
                          const pos = calculateDropdownPosition(e.currentTarget);
                          setMenuPosition(pos);
                          setOpenMenuId(doc.guid);
                        }
                      }}
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
                  }
                >
                  <DropdownMenuItem
                    onClick={() => {
                      setOpenMenuId(null);
                      onEdit(doc);
                    }}
                  >
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    href={`/admin/upload?documentGuid=${doc.guid}`}
                    onClick={() => setOpenMenuId(null)}
                  >
                    Upload New Version
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setOpenMenuId(null);
                      setReprocessTarget(doc);
                    }}
                  >
                    Reprocess
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="danger"
                    onClick={() => {
                      setOpenMenuId(null);
                      setDeleteTarget(doc);
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenu>
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
      <ConfirmDialog
        open={reprocessTarget !== null}
        title="Reprocess Document"
        message={`Are you sure you want to reprocess "${reprocessTarget?.name}"? This will delete existing chunks and embeddings, then re-run the full processing pipeline.`}
        confirmLabel={isReprocessing ? "Reprocessing..." : "Reprocess"}
        onConfirm={handleReprocess}
        onCancel={() => setReprocessTarget(null)}
      />
    </div>
  );
}
