"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { fetchDocumentDownloadUrl } from "@/lib/api/documents";
import type { DocumentDownloadUrlResponse } from "@/types/documents";

// Dynamically import PdfViewer with SSR disabled to avoid browser API issues
const PdfViewer = dynamic(() => import("./PdfViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-zinc-600 dark:text-zinc-400">Loading viewer...</p>
      </div>
    </div>
  ),
});

interface DocumentViewerContainerProps {
  guid: string;
  initialPage?: number;
}

export default function DocumentViewerContainer({
  guid,
  initialPage,
}: DocumentViewerContainerProps) {
  const [downloadData, setDownloadData] = useState<DocumentDownloadUrlResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDownloadUrl = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchDocumentDownloadUrl(guid);
      setDownloadData(data);
    } catch (err) {
      console.error("Failed to fetch download URL:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load document"
      );
    } finally {
      setIsLoading(false);
    }
  }, [guid]);

  useEffect(() => {
    loadDownloadUrl();
  }, [loadDownloadUrl]);

  // Handle auth error (SAS token expired) by fetching a new URL
  const handleAuthError = useCallback(async () => {
    console.log("Auth error detected, refreshing SAS URL...");
    await loadDownloadUrl();
  }, [loadDownloadUrl]);

  // Get a fresh URL for opening in new tab
  const handleRequestFreshUrl = useCallback(async (): Promise<string | null> => {
    try {
      const data = await fetchDocumentDownloadUrl(guid);
      return data.download_url;
    } catch (err) {
      console.error("Failed to get fresh URL:", err);
      return null;
    }
  }, [guid]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Loading document...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center p-8">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg
              className="w-12 h-12 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-lg font-medium">{error}</p>
          </div>
          <button
            onClick={loadDownloadUrl}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!downloadData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-zinc-600 dark:text-zinc-400">
          No document available
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
      <PdfViewer
        url={downloadData.download_url}
        fileName={downloadData.file_name}
        initialPage={initialPage}
        onAuthError={handleAuthError}
        onRequestFreshUrl={handleRequestFreshUrl}
      />
    </div>
  );
}
