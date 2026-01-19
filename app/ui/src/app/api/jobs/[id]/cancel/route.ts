import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { JobActionResponse } from "@/types/jobs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await serverFetch<JobActionResponse>(`/api/jobs/${id}/cancel`, {
      method: "POST",
    });
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to cancel job";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
