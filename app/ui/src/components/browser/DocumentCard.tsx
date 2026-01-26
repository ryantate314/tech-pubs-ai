import Link from "next/link";
import type { DocumentListItem } from "@/types/documents";

interface DocumentCardProps {
  document: DocumentListItem;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function DocumentCard({ document }: DocumentCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
        <svg
          className="h-5 w-5 text-blue-600 dark:text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
          />
        </svg>
      </div>
      <h3 className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {document.name}
      </h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {document.aircraft_model_code ?? "—"} · {document.category_name ?? "—"}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {formatDate(document.created_at)}
        </span>
        <Link
          href={`/admin/documents/${document.guid}`}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View →
        </Link>
      </div>
    </div>
  );
}
