import type { JobStatus } from "@/types/jobs";

interface JobsFilterProps {
  selectedStatus: JobStatus | "";
  onStatusChange: (status: JobStatus | "") => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
}

const statusOptions: { value: JobStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "running", label: "Running" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

export function JobsFilter({
  selectedStatus,
  onStatusChange,
  startDate,
  onStartDateChange,
}: JobsFilterProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <div>
        <label
          htmlFor="status-filter"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Status
        </label>
        <select
          id="status-filter"
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value as JobStatus | "")}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="start-date"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Since
        </label>
        <input
          type="datetime-local"
          id="start-date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        />
      </div>
    </div>
  );
}
