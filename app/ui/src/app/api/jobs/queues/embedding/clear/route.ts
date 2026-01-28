import { NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { QueueActionResponse } from "@/types/jobs";

export async function POST() {
  try {
    const data = await serverFetch<QueueActionResponse>(
      `/api/jobs/queues/embedding/clear`,
      {
        method: "POST",
      }
    );
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to clear embedding queue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
