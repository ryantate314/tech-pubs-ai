"use client";

import { useSearchParams } from "next/navigation";
import { FileUploader } from "@/components/upload/FileUploader";

export default function UploadPage() {
  const searchParams = useSearchParams();
  const documentGuid = searchParams.get("documentGuid") ?? undefined;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          {documentGuid ? "Upload New Version" : "Upload Document"}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {documentGuid
            ? "Upload a new version of the existing document. The document will be processed and indexed for search."
            : "Upload a PDF document to the system. The document will be processed and indexed for search."}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <FileUploader documentGuid={documentGuid} />
      </div>
    </div>
  );
}
