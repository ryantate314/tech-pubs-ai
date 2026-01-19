import type { DocumentJobStatus } from "@/types/documents";

interface DocumentStatusIndicatorProps {
  status: DocumentJobStatus | null;
}

const statusConfig: Record<
  DocumentJobStatus | "none",
  { label: string; dotClass: string }
> = {
  pending: {
    label: "Pending",
    dotClass: "bg-yellow-400",
  },
  running: {
    label: "Processing",
    dotClass: "bg-blue-500 animate-pulse",
  },
  completed: {
    label: "Ready",
    dotClass: "bg-green-500",
  },
  failed: {
    label: "Failed",
    dotClass: "bg-red-500",
  },
  cancelled: {
    label: "Cancelled",
    dotClass: "bg-zinc-400",
  },
  none: {
    label: "No job",
    dotClass: "bg-zinc-400",
  },
};

export function DocumentStatusIndicator({
  status,
}: DocumentStatusIndicatorProps) {
  const config = statusConfig[status ?? "none"];

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-block h-2 w-2 rounded-full ${config.dotClass}`} />
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        {config.label}
      </span>
    </div>
  );
}
