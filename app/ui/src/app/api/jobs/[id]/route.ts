import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { JobDetailResponse } from "@/types/jobs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await serverFetch<JobDetailResponse>(`/api/jobs/${id}`);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch job details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
