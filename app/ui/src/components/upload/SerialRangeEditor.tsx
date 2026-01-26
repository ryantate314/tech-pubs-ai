"use client";

import type { SerialRangeInput, SerialRangeType } from "@/types/uploads";

interface SerialRangeEditorProps {
  ranges: SerialRangeInput[];
  onChange: (ranges: SerialRangeInput[]) => void;
  disabled?: boolean;
}

const RANGE_TYPE_LABELS: Record<SerialRangeType, string> = {
  single: "Single",
  range: "Range",
  and_subs: "And Subs",
};

export function SerialRangeEditor({
  ranges,
  onChange,
  disabled = false,
}: SerialRangeEditorProps) {
  const handleAddRange = () => {
    onChange([...ranges, { range_type: "single", serial_start: 0 }]);
  };

  const handleRemoveRange = (index: number) => {
    onChange(ranges.filter((_, i) => i !== index));
  };

  const handleTypeChange = (index: number, newType: SerialRangeType) => {
    const updated = [...ranges];
    updated[index] = {
      ...updated[index],
      range_type: newType,
      serial_end: newType === "range" ? updated[index].serial_start : undefined,
    };
    onChange(updated);
  };

  const handleStartChange = (index: number, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;

    const updated = [...ranges];
    updated[index] = {
      ...updated[index],
      serial_start: numValue,
      serial_end:
        updated[index].range_type === "range" &&
        (updated[index].serial_end ?? 0) < numValue
          ? numValue
          : updated[index].serial_end,
    };
    onChange(updated);
  };

  const handleEndChange = (index: number, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0) return;

    const updated = [...ranges];
    updated[index] = {
      ...updated[index],
      serial_end: numValue,
    };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Serial Number Ranges
      </label>

      {ranges.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No serial ranges specified. This document applies to all serial
          numbers.
        </p>
      ) : (
        <div className="space-y-2">
          {ranges.map((range, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-800"
            >
              <select
                value={range.range_type}
                onChange={(e) =>
                  handleTypeChange(index, e.target.value as SerialRangeType)
                }
                disabled={disabled}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              >
                {Object.entries(RANGE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="0"
                value={range.serial_start}
                onChange={(e) => handleStartChange(index, e.target.value)}
                disabled={disabled}
                placeholder="Start"
                className="w-28 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
              />

              {range.range_type === "range" && (
                <>
                  <span className="text-sm text-zinc-500">to</span>
                  <input
                    type="number"
                    min={range.serial_start}
                    value={range.serial_end ?? range.serial_start}
                    onChange={(e) => handleEndChange(index, e.target.value)}
                    disabled={disabled}
                    placeholder="End"
                    className="w-28 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                  />
                </>
              )}

              {range.range_type === "and_subs" && (
                <span className="text-sm text-zinc-500">and subsequent</span>
              )}

              <button
                type="button"
                onClick={() => handleRemoveRange(index)}
                disabled={disabled}
                className="ml-auto rounded-md p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-600 dark:hover:text-zinc-200"
                aria-label="Remove range"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleAddRange}
        disabled={disabled}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
      >
        + Add Range
      </button>
    </div>
  );
}
