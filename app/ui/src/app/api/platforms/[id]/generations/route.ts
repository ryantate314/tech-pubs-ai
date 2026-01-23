import { NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { Generation } from "@/types/wizard";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await serverFetch<Generation[]>(`/api/platforms/${id}/generations`);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch generations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
