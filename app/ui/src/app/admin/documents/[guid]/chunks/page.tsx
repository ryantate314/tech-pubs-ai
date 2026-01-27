"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchDocumentChunks } from "@/lib/api/chunks";
import type { DocumentChunksResponse } from "@/types/chunks";
import { ChunksTable } from "@/components/chunks/ChunksTable";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString();
}

export default function DocumentChunksPage() {
  const params = useParams();
  const guid = params.guid as string;

  const [data, setData] = useState<DocumentChunksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    async function loadChunks() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchDocumentChunks(guid, page, pageSize);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chunks");
      } finally {
        setLoading(false);
      }
    }
    loadChunks();
  }, [guid, page]);

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="text-center text-zinc-500 dark:text-zinc-400">
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="text-center text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <Link
          href="/admin/documents"
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
        >
          Back to Documents
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">
          {data.document_name}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Version: {data.version_name}
        </p>
      </div>

      {/* Stats Row */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Total Chunks
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-white">
            {data.total_chunks}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Embedded
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-white">
            {data.embedded_chunks}
            <span className="ml-1 text-sm font-normal text-zinc-500">
              ({data.total_chunks > 0
                ? Math.round((data.embedded_chunks / data.total_chunks) * 100)
                : 0}
              %)
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Total Tokens
          </p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-white">
            {data.total_tokens.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Embedding Model
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-zinc-900 dark:text-white">
            {data.embedding_model ?? "-"}
          </p>
        </div>
      </div>

      {/* Jobs Section */}
      {data.jobs.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
            Job History
          </h2>
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Completed
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Chunks
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {data.jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                      {job.id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm capitalize text-zinc-600 dark:text-zinc-400">
                      {job.job_type}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <JobStatusBadge status={job.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                      {formatDate(job.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                      {formatDate(job.completed_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                      {job.chunk_start_index !== null && job.chunk_end_index !== null
                        ? `${job.chunk_start_index}-${job.chunk_end_index}`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chunks Section */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
          Chunks
        </h2>
        <ChunksTable chunks={data.chunks} />

        {/* Pagination */}
        {data.total_pages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Page {data.page} of {data.total_pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages || loading}
                className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
