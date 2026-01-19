import { NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { DocumentListResponse } from "@/types/documents";

export async function GET() {
  try {
    const data = await serverFetch<DocumentListResponse>("/api/documents");
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch documents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
