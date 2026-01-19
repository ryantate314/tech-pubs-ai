import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { JobListResponse } from "@/types/jobs";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const endpoint = `/api/jobs${queryString ? `?${queryString}` : ""}`;

    const data = await serverFetch<JobListResponse>(endpoint);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch jobs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
