import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { DocumentDetailResponse } from "@/types/documents";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guid: string }> }
) {
  try {
    const { guid } = await params;
    const data = await serverFetch<DocumentDetailResponse>(
      `/api/documents/${guid}`
    );
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
