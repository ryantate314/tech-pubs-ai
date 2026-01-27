import type { Chunk } from "@/types/chunks";

interface ChunksTableProps {
  chunks: Chunk[];
}

export function ChunksTable({ chunks }: ChunksTableProps) {
  if (chunks.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No chunks found for this document.
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
              Index
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Page
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Chapter
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Tokens
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Embedded
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Model
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Preview
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {chunks.map((chunk) => (
            <tr
              key={chunk.id}
              className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                {chunk.chunk_index}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                {chunk.page_number ?? "-"}
              </td>
              <td className="max-w-[150px] truncate px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                {chunk.chapter_title ?? "-"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                {chunk.token_count ?? "-"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm">
                {chunk.has_embedding ? (
                  <span className="text-green-600 dark:text-green-400">Yes</span>
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-500">No</span>
                )}
              </td>
              <td className="max-w-[120px] truncate whitespace-nowrap px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                {chunk.embedding_model ?? "-"}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
                {chunk.content_preview}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
