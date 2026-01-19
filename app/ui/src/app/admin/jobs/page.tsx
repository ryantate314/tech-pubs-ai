import { JobsMonitor } from "@/components/jobs/JobsMonitor";

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Document Ingestion Jobs
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Monitor and manage document processing jobs. Cancel pending jobs or
            re-queue failed ones.
          </p>
        </div>

        <JobsMonitor />
      </div>
    </div>
  );
}
