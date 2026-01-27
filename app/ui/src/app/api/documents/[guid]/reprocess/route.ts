import { NextRequest, NextResponse } from "next/server";
import type { ReprocessResponse } from "@/types/documents";

const API_URL = process.env.API_URL || "http://localhost:8000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ guid: string }> }
) {
  try {
    const { guid } = await params;
    const response = await fetch(`${API_URL}/api/documents/${guid}/reprocess`, {
      method: "POST",
    });

    if (!response.ok) {
      let message = response.statusText;
      try {
        const errorData = await response.json();
        message = errorData.detail || message;
      } catch {
        // Ignore JSON parsing errors
      }
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const data: ReprocessResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reprocess document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
