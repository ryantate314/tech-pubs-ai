import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { DocumentChunksResponse } from "@/types/chunks";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guid: string }> }
) {
  try {
    const { guid } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "1";
    const pageSize = searchParams.get("page_size") || "50";

    const data = await serverFetch<DocumentChunksResponse>(
      `/api/documents/${guid}/chunks?page=${page}&page_size=${pageSize}`
    );
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch chunks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
