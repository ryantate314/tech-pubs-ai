import type { AircraftModel } from "@/types/aircraft-models";
import { apiRequest } from "./client";

export async function fetchAircraftModels(): Promise<AircraftModel[]> {
  return apiRequest<AircraftModel[]>("/api/aircraft-models");
}
