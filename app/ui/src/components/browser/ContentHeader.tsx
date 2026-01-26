"use client";

interface ContentHeaderProps {
  documentCount: number;
  viewMode: "card" | "table";
  onViewModeChange: (mode: "card" | "table") => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const sortOptions = [
  { value: "date-desc", label: "Newest First" },
  { value: "date-asc", label: "Oldest First" },
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
];

export function ContentHeader({
  documentCount,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
}: ContentHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          Technical Publications
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {documentCount} document{documentCount !== 1 ? "s" : ""}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex rounded-lg border border-zinc-300 dark:border-zinc-700">
          <button
            onClick={() => onViewModeChange("card")}
            className={`rounded-l-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "card"
                ? "bg-blue-600 text-white"
                : "bg-white text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => onViewModeChange("table")}
            className={`rounded-r-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "table"
                ? "bg-blue-600 text-white"
                : "bg-white text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            Table
          </button>
        </div>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
