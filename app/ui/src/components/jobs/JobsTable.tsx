import type { Job } from "@/types/jobs";
import { JobStatusBadge } from "./JobStatusBadge";

interface JobsTableProps {
  jobs: Job[];
  onCancel: (jobId: number) => void;
  onRequeue: (jobId: number) => void;
  actionInProgress: number | null;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString();
}

function formatDuration(
  startedAt: string | null,
  completedAt: string | null
): string {
  if (!startedAt) return "-";

  const start = new Date(startedAt);
  const end = completedAt ? new Date(completedAt) : new Date();
  const diffMs = end.getTime() - start.getTime();

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function JobsTable({
  jobs,
  onCancel,
  onRequeue,
  actionInProgress,
}: JobsTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No jobs found matching your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
        <thead className="bg-zinc-50 dark:bg-zinc-900">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            >
              ID
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            >
              Document
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            >
              Created
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            >
              Duration
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            >
              Error
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
          {jobs.map((job) => (
            <tr key={job.id}>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                {job.id}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100">
                {job.document_name}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm">
                <JobStatusBadge status={job.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                {formatDate(job.created_at)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                {formatDuration(job.started_at, job.completed_at)}
              </td>
              <td className="max-w-xs truncate px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {job.error_message || "-"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm">
                {job.status === "pending" && (
                  <button
                    onClick={() => onCancel(job.id)}
                    disabled={actionInProgress === job.id}
                    className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  >
                    {actionInProgress === job.id ? "Cancelling..." : "Cancel"}
                  </button>
                )}
                {(job.status === "failed" || job.status === "cancelled") && (
                  <button
                    onClick={() => onRequeue(job.id)}
                    disabled={actionInProgress === job.id}
                    className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                  >
                    {actionInProgress === job.id ? "Re-queueing..." : "Re-queue"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
