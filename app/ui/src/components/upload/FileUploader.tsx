"use client";

import { useCallback, useEffect, useState } from "react";
import type { AircraftModel } from "@/types/aircraft-models";
import type { Category } from "@/types/categories";
import type { UploadProgress, UploadStatus } from "@/types/uploads";
import type { Platform, Generation, DocumentCategory, DocumentType } from "@/types/wizard";
import { fetchAircraftModels } from "@/lib/api/aircraft-models";
import { fetchCategories } from "@/lib/api/categories";
import { fetchPlatforms, fetchGenerations, fetchDocumentCategories, fetchDocumentTypes } from "@/lib/api/wizard";
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

  // Wizard classification state
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [platformsLoading, setPlatformsLoading] = useState(true);
  const [platformsError, setPlatformsError] = useState<string | null>(null);
  const [selectedPlatformId, setSelectedPlatformId] = useState<number | null>(null);

  const [generations, setGenerations] = useState<Generation[]>([]);
  const [generationsLoading, setGenerationsLoading] = useState(false);
  const [generationsError, setGenerationsError] = useState<string | null>(null);
  const [selectedGenerationId, setSelectedGenerationId] = useState<number | null>(null);

  const [documentCategories, setDocumentCategories] = useState<DocumentCategory[]>([]);
  const [documentCategoriesLoading, setDocumentCategoriesLoading] = useState(true);
  const [documentCategoriesError, setDocumentCategoriesError] = useState<string | null>(null);
  const [selectedDocumentCategoryId, setSelectedDocumentCategoryId] = useState<number | null>(null);

  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [documentTypesLoading, setDocumentTypesLoading] = useState(false);
  const [documentTypesError, setDocumentTypesError] = useState<string | null>(null);
  const [selectedDocumentTypeId, setSelectedDocumentTypeId] = useState<number | null>(null);

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

  // Load platforms on mount
  useEffect(() => {
    async function loadPlatforms() {
      try {
        const data = await fetchPlatforms();
        setPlatforms(data);
        if (data.length > 0) {
          setSelectedPlatformId(data[0].id);
        }
      } catch (err) {
        setPlatformsError(
          err instanceof Error ? err.message : "Failed to load platforms"
        );
      } finally {
        setPlatformsLoading(false);
      }
    }
    loadPlatforms();
  }, []);

  // Load generations when platform changes
  useEffect(() => {
    if (!selectedPlatformId) {
      setGenerations([]);
      setSelectedGenerationId(null);
      return;
    }

    const platformId = selectedPlatformId;
    async function loadGenerations() {
      setGenerationsLoading(true);
      setGenerationsError(null);
      try {
        const data = await fetchGenerations(platformId);
        setGenerations(data);
        if (data.length > 0) {
          setSelectedGenerationId(data[0].id);
        } else {
          setSelectedGenerationId(null);
        }
      } catch (err) {
        setGenerationsError(
          err instanceof Error ? err.message : "Failed to load generations"
        );
        setSelectedGenerationId(null);
      } finally {
        setGenerationsLoading(false);
      }
    }
    loadGenerations();
  }, [selectedPlatformId]);

  // Load document categories on mount
  useEffect(() => {
    async function loadDocumentCategories() {
      try {
        const data = await fetchDocumentCategories();
        setDocumentCategories(data);
        if (data.length > 0) {
          setSelectedDocumentCategoryId(data[0].id);
        }
      } catch (err) {
        setDocumentCategoriesError(
          err instanceof Error ? err.message : "Failed to load document categories"
        );
      } finally {
        setDocumentCategoriesLoading(false);
      }
    }
    loadDocumentCategories();
  }, []);

  // Load document types when category changes
  useEffect(() => {
    if (!selectedDocumentCategoryId) {
      setDocumentTypes([]);
      setSelectedDocumentTypeId(null);
      return;
    }

    const categoryId = selectedDocumentCategoryId;
    async function loadDocumentTypes() {
      setDocumentTypesLoading(true);
      setDocumentTypesError(null);
      try {
        const data = await fetchDocumentTypes(categoryId);
        setDocumentTypes(data);
        if (data.length > 0) {
          setSelectedDocumentTypeId(data[0].id);
        } else {
          setSelectedDocumentTypeId(null);
        }
      } catch (err) {
        setDocumentTypesError(
          err instanceof Error ? err.message : "Failed to load document types"
        );
        setSelectedDocumentTypeId(null);
      } finally {
        setDocumentTypesLoading(false);
      }
    }
    loadDocumentTypes();
  }, [selectedDocumentCategoryId]);

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
      !selectedPlatformId ||
      !selectedGenerationId ||
      !selectedDocumentCategoryId ||
      !selectedDocumentTypeId ||
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
        platform_id: selectedPlatformId,
        generation_id: selectedGenerationId,
        document_type_id: selectedDocumentTypeId,
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
        platform_id: selectedPlatformId,
        generation_id: selectedGenerationId,
        document_type_id: selectedDocumentTypeId,
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
    // Reset wizard selections to first item in each list
    if (platforms.length > 0) {
      setSelectedPlatformId(platforms[0].id);
    }
    if (documentCategories.length > 0) {
      setSelectedDocumentCategoryId(documentCategories[0].id);
    }
    // Note: generations and documentTypes will auto-reset via useEffect
    // when platform/category change triggers re-fetch
  };

  const isUploading =
    uploadStatus === "requesting-url" ||
    uploadStatus === "uploading" ||
    uploadStatus === "completing";

  const canUpload =
    selectedFile &&
    selectedAircraftModelId &&
    selectedCategoryId &&
    selectedPlatformId &&
    selectedGenerationId &&
    selectedDocumentCategoryId &&
    selectedDocumentTypeId &&
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

      {/* Wizard Classification: Platform & Generation */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="platform"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Platform
          </label>
          {platformsLoading ? (
            <div className="flex h-10 items-center text-sm text-zinc-500">
              Loading platforms...
            </div>
          ) : platformsError ? (
            <div className="flex h-10 items-center text-sm text-red-500">
              {platformsError}
            </div>
          ) : (
            <select
              id="platform"
              value={selectedPlatformId ?? ""}
              onChange={(e) => setSelectedPlatformId(Number(e.target.value))}
              disabled={isUploading || platforms.length === 0}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              {platforms.map((platform) => (
                <option key={platform.id} value={platform.id}>
                  {platform.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label
            htmlFor="generation"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Generation
          </label>
          {generationsLoading ? (
            <div className="flex h-10 items-center text-sm text-zinc-500">
              Loading generations...
            </div>
          ) : generationsError ? (
            <div className="flex h-10 items-center text-sm text-red-500">
              {generationsError}
            </div>
          ) : !selectedPlatformId ? (
            <div className="flex h-10 items-center text-sm text-zinc-500">
              Select a platform first
            </div>
          ) : generations.length === 0 ? (
            <div className="flex h-10 items-center text-sm text-zinc-500">
              No generations available
            </div>
          ) : (
            <select
              id="generation"
              value={selectedGenerationId ?? ""}
              onChange={(e) => setSelectedGenerationId(Number(e.target.value))}
              disabled={isUploading || generations.length === 0}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              {generations.map((gen) => (
                <option key={gen.id} value={gen.id}>
                  {gen.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Wizard Classification: Document Category & Type */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="documentCategory"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Document Category
          </label>
          {documentCategoriesLoading ? (
            <div className="flex h-10 items-center text-sm text-zinc-500">
              Loading document categories...
            </div>
          ) : documentCategoriesError ? (
            <div className="flex h-10 items-center text-sm text-red-500">
              {documentCategoriesError}
            </div>
          ) : (
            <select
              id="documentCategory"
              value={selectedDocumentCategoryId ?? ""}
              onChange={(e) => setSelectedDocumentCategoryId(Number(e.target.value))}
              disabled={isUploading || documentCategories.length === 0}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              {documentCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label
            htmlFor="documentType"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Document Type
          </label>
          {documentTypesLoading ? (
            <div className="flex h-10 items-center text-sm text-zinc-500">
              Loading document types...
            </div>
          ) : documentTypesError ? (
            <div className="flex h-10 items-center text-sm text-red-500">
              {documentTypesError}
            </div>
          ) : !selectedDocumentCategoryId ? (
            <div className="flex h-10 items-center text-sm text-zinc-500">
              Select a document category first
            </div>
          ) : documentTypes.length === 0 ? (
            <div className="flex h-10 items-center text-sm text-zinc-500">
              No document types available
            </div>
          ) : (
            <select
              id="documentType"
              value={selectedDocumentTypeId ?? ""}
              onChange={(e) => setSelectedDocumentTypeId(Number(e.target.value))}
              disabled={isUploading || documentTypes.length === 0}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            >
              {documentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
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
