"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { cancelJob, fetchJobDetail, requeueJob } from "@/lib/api/jobs";
import type { JobDetailResponse } from "@/types/jobs";
import { ChildJobsTable } from "@/components/jobs/ChildJobsTable";
import { JobProgressIndicator } from "@/components/jobs/JobProgressIndicator";
import { JobStatusBadge } from "@/components/jobs/JobStatusBadge";

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString();
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

export default function JobDetailPage() {
  const params = useParams();
  const jobId = Number(params.id);

  const [data, setData] = useState<JobDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);

  const loadJob = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchJobDetail(jobId);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load job");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadJob, 30000);
    return () => clearInterval(interval);
  }, [loadJob]);

  const handleCancel = async (id: number) => {
    try {
      setActionInProgress(id);
      await cancelJob(id);
      await loadJob();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel job");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRequeue = async (id: number) => {
    try {
      setActionInProgress(id);
      await requeueJob(id);
      await loadJob();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to requeue job");
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="text-center text-zinc-500 dark:text-zinc-400">
          Loading...
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="text-center text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { parent_job, child_jobs } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <Link
          href="/admin/jobs"
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
        >
          Back to Jobs
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">
          {parent_job.document_name}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Version: {parent_job.document_version}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Parent Job Summary */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
          Parent Job
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Job ID
            </p>
            <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">
              {parent_job.id}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Type
            </p>
            <p className="mt-1 text-lg font-semibold capitalize text-zinc-900 dark:text-white">
              {parent_job.job_type}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Status
            </p>
            <div className="mt-1">
              <JobStatusBadge status={parent_job.status} />
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Child Progress
            </p>
            <div className="mt-1">
              <JobProgressIndicator counts={parent_job.child_job_counts} />
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Created
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
              {formatDate(parent_job.created_at)}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Duration
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
              {formatDuration(parent_job.started_at, parent_job.completed_at)}
            </p>
          </div>
        </div>

        {parent_job.error_message && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Error: {parent_job.error_message}
            </p>
          </div>
        )}

        {/* Parent job actions */}
        <div className="mt-4 flex gap-2">
          {(parent_job.status === "pending" || parent_job.status === "running") && (
            <button
              onClick={() => handleCancel(parent_job.id)}
              disabled={actionInProgress === parent_job.id}
              className="rounded bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              {actionInProgress === parent_job.id ? "Cancelling..." : "Cancel Parent Job"}
            </button>
          )}
          {(parent_job.status === "failed" || parent_job.status === "cancelled") && (
            <button
              onClick={() => handleRequeue(parent_job.id)}
              disabled={actionInProgress === parent_job.id}
              className="rounded bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
            >
              {actionInProgress === parent_job.id ? "Re-queueing..." : "Re-queue Parent Job"}
            </button>
          )}
          <button
            onClick={loadJob}
            className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Child Jobs Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Child Jobs ({child_jobs.length})
          </h2>
        </div>
        <ChildJobsTable
          jobs={child_jobs}
          onCancel={handleCancel}
          onRequeue={handleRequeue}
          actionInProgress={actionInProgress}
        />
      </div>

      <p className="mt-6 text-xs text-zinc-400 dark:text-zinc-500">
        Auto-refreshes every 30 seconds
      </p>
    </div>
  );
}
