"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { pdfjs, Document } from "react-pdf";
import type { PDFDocumentProxy } from "pdfjs-dist";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import SinglePageView from "./SinglePageView";

// Configure pdf.js worker from CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;

interface OutlineItem {
  title: string;
  dest: string | unknown[] | null;
  items?: OutlineItem[];
}

interface PdfViewerProps {
  url: string;
  fileName: string;
  initialPage?: number;
  onAuthError?: () => void;
  onRequestFreshUrl?: () => Promise<string | null>;
}

export default function PdfViewer({
  url,
  fileName,
  initialPage,
  onAuthError,
  onRequestFreshUrl,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(initialPage ?? 1);
  const [pageInputValue, setPageInputValue] = useState<string>(String(initialPage ?? 1));
  const [scale, setScale] = useState<number>(1.0);
  const [fitMode, setFitMode] = useState<"fit" | "manual">("fit");
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [outline, setOutline] = useState<OutlineItem[] | null>(null);
  const [showOutline, setShowOutline] = useState<boolean>(false);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOpeningInNewTab, setIsOpeningInNewTab] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  const onDocumentLoadSuccess = useCallback(async (pdf: PDFDocumentProxy) => {
    pdfDocRef.current = pdf;
    setNumPages(pdf.numPages);
    setIsLoading(false);
    setError(null);

    // Validate and adjust current page if it exceeds document length
    if (initialPage && initialPage > pdf.numPages) {
      setCurrentPage(pdf.numPages);
    } else if (initialPage && initialPage < 1) {
      setCurrentPage(1);
    }

    // Get page dimensions from the first page for fit-to-screen calculation
    try {
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 });
      setPageDimensions({ width: viewport.width, height: viewport.height });
    } catch {
      // Fallback to standard letter size dimensions
      setPageDimensions({ width: 612, height: 792 });
    }

    // Try to load outline/TOC
    try {
      const pdfOutline = await pdf.getOutline();
      if (pdfOutline && pdfOutline.length > 0) {
        setOutline(pdfOutline as OutlineItem[]);
        setShowOutline(true);
      }
    } catch {
      // No outline available
    }
  }, [initialPage]);

  const onDocumentLoadError = useCallback(
    (err: Error) => {
      console.error("PDF load error:", err);
      setIsLoading(false);

      // Check for auth errors (403)
      if (err.message?.includes("403") || err.message?.includes("Forbidden")) {
        if (onAuthError) {
          onAuthError();
          return;
        }
      }

      setError(err.message || "Failed to load PDF");
    },
    [onAuthError]
  );

  const onLoadProgress = useCallback(
    ({ loaded, total }: { loaded: number; total: number }) => {
      if (total > 0) {
        setLoadProgress((loaded / total) * 100);
      }
    },
    []
  );

  // Handle opening PDF in new tab with fresh URL
  const handleOpenInNewTab = useCallback(async () => {
    if (!onRequestFreshUrl) {
      // Fallback to current URL if no refresh function provided
      window.open(url, "_blank");
      return;
    }

    setIsOpeningInNewTab(true);
    try {
      const freshUrl = await onRequestFreshUrl();
      if (freshUrl) {
        window.open(freshUrl, "_blank");
      }
    } catch (err) {
      console.error("Failed to get fresh URL:", err);
      // Fallback to current URL
      window.open(url, "_blank");
    } finally {
      setIsOpeningInNewTab(false);
    }
  }, [onRequestFreshUrl, url]);

  // Calculate fit-to-screen scale when in fit mode
  const calculateFitScale = useCallback(() => {
    if (!viewerContainerRef.current || !pageDimensions) return;

    const container = viewerContainerRef.current;
    // Account for padding (32px = 16px on each side from p-4)
    const availableWidth = container.clientWidth - 32;
    const availableHeight = container.clientHeight - 32;

    const scaleX = availableWidth / pageDimensions.width;
    const scaleY = availableHeight / pageDimensions.height;

    // Use the smaller scale to fit the entire page, clamped to reasonable bounds
    const fitScale = Math.min(scaleX, scaleY);
    const clampedScale = Math.max(0.5, Math.min(3, fitScale));

    setScale(clampedScale);
  }, [pageDimensions]);

  // Recalculate scale when in fit mode and dependencies change
  useEffect(() => {
    if (fitMode !== "fit" || !pageDimensions) return;

    calculateFitScale();

    // Set up ResizeObserver to recalculate on container resize
    const container = viewerContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      calculateFitScale();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [fitMode, pageDimensions, calculateFitScale, showOutline]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          setCurrentPage((prev) => Math.max(1, prev - 1));
          break;
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          setCurrentPage((prev) => Math.min(numPages, prev + 1));
          break;
        case "+":
        case "=":
          e.preventDefault();
          setFitMode("manual");
          setScale((prev) => Math.min(3, prev + 0.25));
          break;
        case "-":
          e.preventDefault();
          setFitMode("manual");
          setScale((prev) => Math.max(0.5, prev - 0.25));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [numPages]);

  // Keep page input synced when page changes via buttons/keyboard/outline
  useEffect(() => {
    setPageInputValue(String(currentPage));
  }, [currentPage]);

  const handleOutlineClick = useCallback(async (item: OutlineItem) => {
    if (!pdfDocRef.current || !item.dest) return;

    try {
      let destRef: unknown;
      if (typeof item.dest === "string") {
        const dest = await pdfDocRef.current.getDestination(item.dest);
        if (dest) {
          destRef = dest[0];
        }
      } else if (Array.isArray(item.dest)) {
        destRef = item.dest[0];
      }

      if (destRef) {
        const pageIndex = await pdfDocRef.current.getPageIndex(
          destRef as Parameters<PDFDocumentProxy["getPageIndex"]>[0]
        );
        setCurrentPage(pageIndex + 1);
      }
    } catch (err) {
      console.error("Failed to navigate to outline item:", err);
    }
  }, []);

  // Handle internal link clicks within the PDF
  const handleItemClick = useCallback(
    ({ pageNumber }: { pageNumber: number }) => {
      setCurrentPage(pageNumber);
    },
    []
  );

  // Page input handlers
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setPageInputValue(value);
    }
  };

  const navigateToPage = (value: string) => {
    const pageNum = parseInt(value, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= numPages) {
      setCurrentPage(pageNum);
    }
    setPageInputValue(String(currentPage));
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      navigateToPage(pageInputValue);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setPageInputValue(String(currentPage));
      (e.target as HTMLInputElement).blur();
    }
  };

  const handlePageInputBlur = () => {
    navigateToPage(pageInputValue);
  };

  const renderOutlineItems = (
    items: OutlineItem[],
    level: number = 0
  ): React.ReactNode => {
    return (
      <ul className={level > 0 ? "ml-4" : ""}>
        {items.map((item, index) => (
          <li key={index} className="py-1">
            <button
              onClick={() => handleOutlineClick(item)}
              className="text-left text-sm text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white truncate w-full"
            >
              {item.title}
            </button>
            {item.items &&
              item.items.length > 0 &&
              renderOutlineItems(item.items, level + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div
      className="flex flex-col h-full bg-zinc-100 dark:bg-zinc-900"
      ref={containerRef}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-4">
          {/* Outline toggle */}
          {outline && (
            <button
              onClick={() => setShowOutline(!showOutline)}
              className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
              title="Toggle Table of Contents"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </button>
          )}

          {/* File name */}
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-xs">
            {fileName}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Page navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pageInputValue}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputKeyDown}
              onBlur={handlePageInputBlur}
              onFocus={(e) => e.target.select()}
              disabled={!numPages}
              aria-label="Page number"
              className="w-12 rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-center text-sm text-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-200"
            />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              / {numPages || "..."}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(numPages, prev + 1))
              }
              disabled={currentPage >= numPages}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFitMode("manual");
                setScale((prev) => Math.max(0.5, prev - 0.25));
              }}
              disabled={scale <= 0.5}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50"
              title="Zoom out (-)"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </button>
            <button
              onClick={() => setFitMode("fit")}
              className={`px-2 py-0.5 text-sm rounded transition-colors ${
                fitMode === "fit"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              }`}
              title="Fit to screen"
            >
              {fitMode === "fit" ? "Fit" : `${Math.round(scale * 100)}%`}
            </button>
            <button
              onClick={() => {
                setFitMode("manual");
                setScale((prev) => Math.min(3, prev + 0.25));
              }}
              disabled={scale >= 3}
              className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50"
              title="Zoom in (+)"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>

          {/* Open in new tab button */}
          <button
            onClick={handleOpenInNewTab}
            disabled={isOpeningInNewTab}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
            title="Open full PDF in new tab"
          >
            {isOpeningInNewTab ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            )}
            Open Full PDF
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {isLoading && loadProgress < 100 && (
        <div className="h-1 bg-zinc-200 dark:bg-zinc-700">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${loadProgress}%` }}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* TOC Sidebar */}
        {showOutline && outline && (
          <div className="w-64 border-r border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 overflow-y-auto p-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-3">
              Table of Contents
            </h3>
            {renderOutlineItems(outline)}
          </div>
        )}

        {/* PDF Document */}
        <div className="flex-1 overflow-auto" ref={viewerContainerRef}>
          {error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    setIsLoading(true);
                    setLoadProgress(0);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              onLoadProgress={onLoadProgress}
              onItemClick={handleItemClick}
              loading={
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto m-4"></div>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      Loading PDF...
                    </p>
                  </div>
                </div>
              }
            >
              <SinglePageView
                numPages={numPages}
                currentPage={currentPage}
                scale={scale}
                onPageChange={setCurrentPage}
              />
            </Document>
          )}
        </div>
      </div>
    </div>
  );
}
