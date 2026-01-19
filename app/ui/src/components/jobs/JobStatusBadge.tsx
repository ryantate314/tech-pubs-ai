import type { JobStatus } from "@/types/jobs";

interface JobStatusBadgeProps {
  status: JobStatus;
}

const statusConfig: Record<
  JobStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  running: {
    label: "Running",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  completed: {
    label: "Completed",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  },
};

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
