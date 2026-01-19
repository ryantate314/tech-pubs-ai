import Link from "next/link";
import type { DocumentListItem } from "@/types/documents";
import { DocumentStatusIndicator } from "./DocumentStatusIndicator";

interface DocumentsTableProps {
  documents: DocumentListItem[];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function DocumentsTable({ documents }: DocumentsTableProps) {
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
              Category
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Created
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Status
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
                  href={`/admin/documents/${doc.guid}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {doc.name}
                </Link>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                {doc.aircraft_model_code ?? "-"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                {doc.category_name ?? "-"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                {formatDate(doc.created_at)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <DocumentStatusIndicator status={doc.latest_job_status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
