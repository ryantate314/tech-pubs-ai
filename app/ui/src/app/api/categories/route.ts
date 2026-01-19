import { NextResponse } from "next/server";
import { serverFetch } from "@/lib/api/server";
import type { Category } from "@/types/categories";

export async function GET() {
  try {
    const data = await serverFetch<Category[]>("/api/categories");
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch categories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
