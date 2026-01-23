import { NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { Platform } from "@/types/wizard";

export async function GET() {
  try {
    const data = await serverFetch<Platform[]>("/api/platforms");
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch platforms";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
