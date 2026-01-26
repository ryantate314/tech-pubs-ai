import { NextRequest, NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { SearchResponse } from "@/types/search";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await serverFetch<SearchResponse>("/api/search", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
