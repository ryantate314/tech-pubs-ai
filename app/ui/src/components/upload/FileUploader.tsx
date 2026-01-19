"use client";

import { useCallback, useEffect, useState } from "react";
import type { AircraftModel } from "@/types/aircraft-models";
import type { Category } from "@/types/categories";
import type { UploadProgress, UploadStatus } from "@/types/uploads";
import { fetchAircraftModels } from "@/lib/api/aircraft-models";
import { fetchCategories } from "@/lib/api/categories";
import {
  completeUpload,
  requestUploadUrl,
  uploadFileToBlob,
} from "@/lib/api/uploads";
import { UploadDropzone } from "./UploadDropzone";
import { UploadProgressDisplay } from "./UploadProgress";

export function FileUploader() {
  const [aircraftModels, setAircraftModels] = useState<AircraftModel[]>([]);
  const [aircraftModelsLoading, setAircraftModelsLoading] = useState(true);
  const [aircraftModelsError, setAircraftModelsError] = useState<string | null>(
    null
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [selectedAircraftModelId, setSelectedAircraftModelId] = useState<
    number | null
  >(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [documentName, setDocumentName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    documentId: number;
    jobId: number;
  } | null>(null);

  useEffect(() => {
    async function loadAircraftModels() {
      try {
        const data = await fetchAircraftModels();
        setAircraftModels(data);
        if (data.length > 0) {
          setSelectedAircraftModelId(data[0].id);
        }
      } catch (err) {
        setAircraftModelsError(
          err instanceof Error ? err.message : "Failed to load aircraft models"
        );
      } finally {
        setAircraftModelsLoading(false);
      }
    }
    loadAircraftModels();
  }, []);

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await fetchCategories();
        setCategories(data);
        if (data.length > 0) {
          setSelectedCategoryId(data[0].id);
        }
      } catch (err) {
        setCategoriesError(
          err instanceof Error ? err.message : "Failed to load categories"
        );
      } finally {
        setCategoriesLoading(false);
      }
    }
    loadCategories();
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setUploadStatus("idle");
    setUploadProgress(null);
    setUploadError(null);
    setUploadResult(null);
  }, []);

  const handleUpload = async () => {
    if (
      !selectedFile ||
      !selectedAircraftModelId ||
      !selectedCategoryId ||
      !documentName.trim()
    ) {
      return;
    }

    setUploadError(null);
    setUploadResult(null);

    try {
      setUploadStatus("requesting-url");

      const urlResponse = await requestUploadUrl({
        filename: selectedFile.name,
        content_type: selectedFile.type || "application/octet-stream",
        file_size: selectedFile.size,
        document_name: documentName.trim(),
        aircraft_model_id: selectedAircraftModelId,
        category_id: selectedCategoryId,
      });

      setUploadStatus("uploading");

      await uploadFileToBlob(
        urlResponse.upload_url,
        selectedFile,
        setUploadProgress
      );

      setUploadStatus("completing");

      const completeResponse = await completeUpload({
        blob_path: urlResponse.blob_path,
        document_name: documentName.trim(),
        filename: selectedFile.name,
        content_type: selectedFile.type || "application/octet-stream",
        file_size: selectedFile.size,
        aircraft_model_id: selectedAircraftModelId,
        category_id: selectedCategoryId,
      });

      setUploadStatus("success");
      setUploadResult({
        documentId: completeResponse.document_id,
        jobId: completeResponse.job_id,
      });
    } catch (err) {
      setUploadStatus("error");
      setUploadError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setDocumentName("");
    setUploadStatus("idle");
    setUploadProgress(null);
    setUploadError(null);
    setUploadResult(null);
  };

  const isUploading =
    uploadStatus === "requesting-url" ||
    uploadStatus === "uploading" ||
    uploadStatus === "completing";

  const canUpload =
    selectedFile &&
    selectedAircraftModelId &&
    selectedCategoryId &&
    documentName.trim() &&
    !isUploading &&
    uploadStatus !== "success";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="aircraftModel"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Aircraft Model
          </label>
          {aircraftModelsLoading ? (
            <div className="flex h-10 items-center text-sm text-zinc-500">
              Loading aircraft models...
            </div>
          ) : aircraftModelsError ? (
            <div className="flex h-10 items-center text-sm text-red-500">
              {aircraftModelsError}
            </div>
          ) : (
            <select
              id="aircraftModel"
              value={selectedAircraftModelId ?? ""}
              onChange={(e) =>
                setSelectedAircraftModelId(Number(e.target.value))
              }
              disabled={isUploading || aircraftModels.length === 0}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              {aircraftModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label
            htmlFor="category"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Category
          </label>
          {categoriesLoading ? (
            <div className="flex h-10 items-center text-sm text-zinc-500">
              Loading categories...
            </div>
          ) : categoriesError ? (
            <div className="flex h-10 items-center text-sm text-red-500">
              {categoriesError}
            </div>
          ) : (
            <select
              id="category"
              value={selectedCategoryId ?? ""}
              onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
              disabled={isUploading || categories.length === 0}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="documentName"
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Document Name
        </label>
        <input
          type="text"
          id="documentName"
          value={documentName}
          onChange={(e) => setDocumentName(e.target.value)}
          disabled={isUploading}
          placeholder="Enter a display name for this document"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500"
        />
      </div>

      {!selectedFile && uploadStatus === "idle" && (
        <UploadDropzone
          onFileSelect={handleFileSelect}
          accept=".pdf,application/pdf"
          disabled={isUploading}
        />
      )}

      {selectedFile && (
        <UploadProgressDisplay
          status={uploadStatus}
          progress={uploadProgress}
          filename={selectedFile.name}
          error={uploadError ?? undefined}
        />
      )}

      {uploadResult && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
          <p className="text-sm text-green-800 dark:text-green-200">
            Document uploaded successfully! Document ID:{" "}
            {uploadResult.documentId}, Job ID: {uploadResult.jobId}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        {canUpload && (
          <button
            onClick={handleUpload}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Upload Document
          </button>
        )}

        {(selectedFile || uploadStatus === "success") && !isUploading && (
          <button
            onClick={handleReset}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {uploadStatus === "success" ? "Upload Another" : "Clear"}
          </button>
        )}
      </div>
    </div>
  );
}
