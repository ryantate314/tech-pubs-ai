"use client";

import { useCallback, useEffect, useState } from "react";
import type { ParentJob, ParentJobListResponse, JobStatus } from "@/types/jobs";
import {
  cancelJob,
  clearChunkingQueue,
  clearEmbeddingQueue,
  fetchJobs,
  requeueJob,
} from "@/lib/api/jobs";
import { JobsFilter } from "./JobsFilter";
import { JobsTable } from "./JobsTable";

function getDefaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 2);
  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  return date.toISOString().slice(0, 16);
}

interface StatusCardProps {
  label: string;
  count: number;
  colorClass: string;
}

function StatusCard({ label, count, colorClass }: StatusCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold ${colorClass}`}>{count}</p>
    </div>
  );
}

export function JobsMonitor() {
  const [jobs, setJobs] = useState<ParentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<JobStatus | "">("");
  const [startDate, setStartDate] = useState(getDefaultStartDate);

  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [queueActionInProgress, setQueueActionInProgress] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    queueType: "chunking" | "embedding" | null;
  }>({ isOpen: false, queueType: null });

  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
  });

  const loadJobs = useCallback(async () => {
    try {
      setError(null);
      const params: { status?: JobStatus; startDate?: string } = {};

      if (selectedStatus) {
        params.status = selectedStatus;
      }

      if (startDate) {
        params.startDate = new Date(startDate).toISOString();
      }

      const data: ParentJobListResponse = await fetchJobs(params);
      setJobs(data.jobs);
      setCounts({
        total: data.total,
        pending: data.pending_count,
        running: data.running_count,
        completed: data.completed_count,
        failed: data.failed_count,
        cancelled: data.cancelled_count,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, startDate]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadJobs, 30000);
    return () => clearInterval(interval);
  }, [loadJobs]);

  const handleCancel = async (jobId: number) => {
    try {
      setActionInProgress(jobId);
      await cancelJob(jobId);
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel job");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRequeue = async (jobId: number) => {
    try {
      setActionInProgress(jobId);
      await requeueJob(jobId);
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to requeue job");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleClearQueue = async (queueType: "chunking" | "embedding") => {
    try {
      setQueueActionInProgress(queueType);
      if (queueType === "chunking") {
        await clearChunkingQueue();
      } else {
        await clearEmbeddingQueue();
      }
      await loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to clear ${queueType} queue`);
    } finally {
      setQueueActionInProgress(null);
      setConfirmDialog({ isOpen: false, queueType: null });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Loading jobs...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatusCard
          label="Total"
          count={counts.total}
          colorClass="text-zinc-900 dark:text-zinc-100"
        />
        <StatusCard
          label="Pending"
          count={counts.pending}
          colorClass="text-yellow-600 dark:text-yellow-400"
        />
        <StatusCard
          label="Running"
          count={counts.running}
          colorClass="text-blue-600 dark:text-blue-400"
        />
        <StatusCard
          label="Completed"
          count={counts.completed}
          colorClass="text-green-600 dark:text-green-400"
        />
        <StatusCard
          label="Failed"
          count={counts.failed}
          colorClass="text-red-600 dark:text-red-400"
        />
        <StatusCard
          label="Cancelled"
          count={counts.cancelled}
          colorClass="text-zinc-600 dark:text-zinc-400"
        />
      </div>

      <JobsFilter
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        startDate={startDate}
        onStartDateChange={setStartDate}
      />

      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Clear Queues:
        </span>
        <button
          onClick={() => setConfirmDialog({ isOpen: true, queueType: "chunking" })}
          disabled={queueActionInProgress !== null}
          className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-300 dark:hover:bg-orange-900"
        >
          {queueActionInProgress === "chunking" ? "Clearing..." : "Chunking Queue"}
        </button>
        <button
          onClick={() => setConfirmDialog({ isOpen: true, queueType: "embedding" })}
          disabled={queueActionInProgress !== null}
          className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-300 dark:hover:bg-orange-900"
        >
          {queueActionInProgress === "embedding" ? "Clearing..." : "Embedding Queue"}
        </button>
      </div>

      {confirmDialog.isOpen && confirmDialog.queueType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Clear {confirmDialog.queueType === "chunking" ? "Chunking" : "Embedding"} Queue
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Are you sure you want to clear all messages from the{" "}
              <span className="font-medium">
                document-{confirmDialog.queueType}
              </span>{" "}
              queue? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog({ isOpen: false, queueType: null })}
                disabled={queueActionInProgress !== null}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleClearQueue(confirmDialog.queueType!)}
                disabled={queueActionInProgress !== null}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {queueActionInProgress ? "Clearing..." : "Clear Queue"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Showing {jobs.length} job{jobs.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={loadJobs}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Refresh
        </button>
      </div>

      <JobsTable
        jobs={jobs}
        onCancel={handleCancel}
        onRequeue={handleRequeue}
        actionInProgress={actionInProgress}
      />

      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Auto-refreshes every 30 seconds
      </p>
    </div>
  );
}
