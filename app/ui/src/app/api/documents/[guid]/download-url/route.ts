import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { DocumentDownloadUrlResponse } from "@/types/documents";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guid: string }> }
) {
  try {
    const { guid } = await params;
    const data = await serverFetch<DocumentDownloadUrlResponse>(
      `/api/documents/${guid}/download-url`
    );
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch download URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
