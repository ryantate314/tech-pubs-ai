import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { UploadUrlRequest, UploadUrlResponse } from "@/types/uploads";

export async function POST(request: NextRequest) {
  try {
    const body: UploadUrlRequest = await request.json();
    const data = await serverFetch<UploadUrlResponse>("/api/uploads/request-url", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to request upload URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
