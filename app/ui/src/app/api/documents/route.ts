import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { DocumentListResponse } from "@/types/documents";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const endpoint = `/api/documents${queryString ? `?${queryString}` : ""}`;

    const data = await serverFetch<DocumentListResponse>(endpoint);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch documents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
