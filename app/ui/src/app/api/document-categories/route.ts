import { NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { DocumentCategory } from "@/types/wizard";

export async function GET() {
  try {
    const data = await serverFetch<DocumentCategory[]>("/api/document-categories");
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch document categories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
