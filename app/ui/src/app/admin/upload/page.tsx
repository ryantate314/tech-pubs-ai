import { FileUploader } from "@/components/upload/FileUploader";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Upload Document
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Upload a PDF document to the system. The document will be processed
          and indexed for search.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <FileUploader />
      </div>
    </div>
  );
}
