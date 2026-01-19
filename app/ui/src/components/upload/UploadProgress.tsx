"use client";

import type { UploadProgress, UploadStatus } from "@/types/uploads";

interface UploadProgressProps {
  status: UploadStatus;
  progress: UploadProgress | null;
  filename: string;
  error?: string;
}

export function UploadProgressDisplay({
  status,
  progress,
  filename,
  error,
}: UploadProgressProps) {
  const getStatusText = () => {
    switch (status) {
      case "requesting-url":
        return "Preparing upload...";
      case "uploading":
        return `Uploading... ${progress?.percentage ?? 0}%`;
      case "completing":
        return "Processing...";
      case "success":
        return "Upload complete!";
      case "error":
        return error || "Upload failed";
      default:
        return "";
    }
  };

  const isInProgress =
    status === "requesting-url" ||
    status === "uploading" ||
    status === "completing";

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {status === "success" ? (
            <svg
              className="h-5 w-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : status === "error" ? (
            <svg
              className="h-5 w-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 animate-spin text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {filename}
          </p>
          <p
            className={`text-xs ${status === "error" ? "text-red-600 dark:text-red-400" : "text-zinc-500"}`}
          >
            {getStatusText()}
          </p>
        </div>
      </div>

      {isInProgress && (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress?.percentage ?? 0}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
