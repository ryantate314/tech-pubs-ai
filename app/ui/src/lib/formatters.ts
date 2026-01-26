import type { SerialRangeResponse } from "@/types/documents";

export function formatSerialRange(range: SerialRangeResponse): string {
  switch (range.range_type) {
    case "single":
      return String(range.serial_start);
    case "range":
      return `${range.serial_start}-${range.serial_end}`;
    case "and_subs":
      return `${range.serial_start} & subs`;
    default:
      return String(range.serial_start);
  }
}

export function formatSerialRanges(ranges: SerialRangeResponse[]): string {
  if (ranges.length === 0) return "All";
  return ranges.map(formatSerialRange).join(", ");
}
