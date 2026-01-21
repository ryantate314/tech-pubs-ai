import type {
  UploadCompleteRequest,
  UploadCompleteResponse,
  UploadProgress,
  UploadUrlRequest,
  UploadUrlResponse,
} from "@/types/uploads";
import { apiRequest } from "./client";

export async function requestUploadUrl(
  request: UploadUrlRequest
): Promise<UploadUrlResponse> {
  return apiRequest<UploadUrlResponse>("/api/uploads/request-url", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function completeUpload(
  request: UploadCompleteRequest
): Promise<UploadCompleteResponse> {
  return apiRequest<UploadCompleteResponse>("/api/uploads/complete", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function uploadFileToBlob(
  uploadUrl: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        });
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed due to network error"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload was aborted"));
    });

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("x-ms-blob-type", "BlockBlob");
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}
