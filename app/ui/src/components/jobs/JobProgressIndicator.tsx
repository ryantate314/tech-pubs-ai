import type { ChildJobCounts } from "@/types/jobs";

interface JobProgressIndicatorProps {
  counts: ChildJobCounts;
}

export function JobProgressIndicator({ counts }: JobProgressIndicatorProps) {
  const { total, completed, failed } = counts;

  // Determine color based on status
  let colorClass = "text-zinc-600 dark:text-zinc-400"; // default/no children

  if (total > 0) {
    if (failed > 0) {
      // Any failures: red
      colorClass = "text-red-600 dark:text-red-400";
    } else if (completed === total) {
      // All complete: green
      colorClass = "text-green-600 dark:text-green-400";
    } else {
      // In progress: blue
      colorClass = "text-blue-600 dark:text-blue-400";
    }
  }

  if (total === 0) {
    return (
      <span className="text-sm text-zinc-400 dark:text-zinc-500">-</span>
    );
  }

  return (
    <span className={`text-sm font-medium ${colorClass}`}>
      {completed}/{total}
      {failed > 0 && (
        <span className="ml-1 text-red-600 dark:text-red-400">
          ({failed} failed)
        </span>
      )}
    </span>
  );
}
