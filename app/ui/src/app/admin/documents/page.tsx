import { DocumentsList } from "@/components/documents/DocumentsList";

export default function DocumentsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Documents
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            View and manage all uploaded documents and their processing status.
          </p>
        </div>

        <DocumentsList />
      </div>
    </div>
  );
}
