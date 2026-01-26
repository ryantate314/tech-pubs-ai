import Link from "next/link";
import type { ChunkResult } from "@/types/search";

interface SearchResultCardProps {
  result: ChunkResult;
}

function SimilarityBadge({ similarity }: { similarity: number }) {
  const percentage = Math.round(similarity * 100);
  let colorClasses: string;

  if (percentage >= 80) {
    colorClasses =
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  } else if (percentage >= 60) {
    colorClasses =
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  } else {
    colorClasses =
      "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClasses}`}
    >
      {percentage}% match
    </span>
  );
}

export function SearchResultCard({ result }: SearchResultCardProps) {
  const viewUrl = `/admin/documents/${result.document_guid}${result.page_number ? `?page=${result.page_number}` : ""}`;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-white">
            {result.document_name}
          </h3>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            {result.page_number && <span>Page {result.page_number}</span>}
            {result.chapter_title && (
              <>
                {result.page_number && <span>&bull;</span>}
                <span>{result.chapter_title}</span>
              </>
            )}
          </div>
        </div>
        <SimilarityBadge similarity={result.similarity} />
      </div>

      <p className="mb-3 line-clamp-4 text-sm text-zinc-600 dark:text-zinc-300">
        {result.summary}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {result.aircraft_model_code && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {result.aircraft_model_code}
            </span>
          )}
          {result.category_name && (
            <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              {result.category_name}
            </span>
          )}
        </div>
        <Link
          href={viewUrl}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View in document
        </Link>
      </div>
    </div>
  );
}
