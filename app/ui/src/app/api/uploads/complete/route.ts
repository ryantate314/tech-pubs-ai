import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { UploadCompleteRequest, UploadCompleteResponse } from "@/types/uploads";

export async function POST(request: NextRequest) {
  try {
    const body: UploadCompleteRequest = await request.json();
    const data = await serverFetch<UploadCompleteResponse>("/api/uploads/complete", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to complete upload";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
