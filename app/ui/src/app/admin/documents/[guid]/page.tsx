import Link from "next/link";
import { serverFetch } from "@/lib/api/server";
import { formatSerialRanges } from "@/lib/formatters";
import type { DocumentDetailResponse } from "@/types/documents";
import DocumentViewerContainer from "@/components/pdf/DocumentViewerContainer";

interface DocumentDetailPageProps {
  params: Promise<{
    guid: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

async function getDocument(guid: string): Promise<DocumentDetailResponse | null> {
  try {
    return await serverFetch<DocumentDetailResponse>(`/api/documents/${guid}`);
  } catch (error) {
    console.error("Failed to fetch document:", error);
    return null;
  }
}

export default async function DocumentDetailPage({
  params,
  searchParams,
}: DocumentDetailPageProps) {
  const { guid } = await params;
  const { page } = await searchParams;
  const document = await getDocument(guid);
  const initialPage = page ? parseInt(page, 10) : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 mb-2">
          <Link
            href="/admin/documents"
            className="hover:text-zinc-900 dark:hover:text-white"
          >
            Documents
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-white">
            {document?.name || "Document"}
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          {document?.name || "Document Viewer"}
        </h1>
        {document && (
          <div className="flex items-center gap-4 mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {document.latest_version && (
              <span>Version: {document.latest_version.name}</span>
            )}
            {document.aircraft_model_code && (
              <span>Model: {document.aircraft_model_code}</span>
            )}
            <span>Serial Numbers: {formatSerialRanges(document.serial_ranges)}</span>
          </div>
        )}
      </div>

      {!document ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-lg font-medium text-red-600 dark:text-red-400">
            Document not found
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            The requested document could not be found or may have been deleted.
          </p>
          <Link
            href="/admin/documents"
            className="inline-block mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Documents
          </Link>
        </div>
      ) : !document.latest_version ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-lg font-medium text-zinc-900 dark:text-white">
            No version available
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            This document does not have any versions uploaded yet.
          </p>
        </div>
      ) : (
        <DocumentViewerContainer guid={guid} initialPage={initialPage} />
      )}
    </div>
  );
}
