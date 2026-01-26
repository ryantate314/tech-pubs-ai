"use client";

import { Page } from "react-pdf";

interface SinglePageViewProps {
  numPages: number;
  currentPage: number;
  scale: number;
  onPageChange: (page: number) => void;
}

export default function SinglePageView({
  currentPage,
  scale,
}: SinglePageViewProps) {
  return (
    <div className="flex justify-center bg-zinc-200 dark:bg-zinc-900 p-4">
      <div className="shadow-lg">
        <Page
          pageNumber={currentPage}
          scale={scale}
          loading={
            <div className="flex items-center justify-center w-[612px] h-[792px] bg-white">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          }
          error={
            <div className="flex items-center justify-center w-[612px] h-[792px] bg-white text-red-600">
              Failed to load page {currentPage}
            </div>
          }
          renderTextLayer={true}
          renderAnnotationLayer={true}
        />
      </div>
    </div>
  );
}
