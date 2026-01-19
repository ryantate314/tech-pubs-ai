import { NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { AircraftModel } from "@/types/aircraft-models";

export async function GET() {
  try {
    const data = await serverFetch<AircraftModel[]>("/api/aircraft-models");
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch aircraft models";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
