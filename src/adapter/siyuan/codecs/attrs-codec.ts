import type { SparkleDraftStatus } from "../../../domain/value-objects/common.js";
import { hasText } from "../../../domain/support/helpers.js";

export function parseJournalDateFromHPath(
  hpath: string | undefined,
): string | undefined {
  if (!hasText(hpath)) {
    return undefined;
  }

  const match = hpath.match(/\b\d{4}-\d{2}-\d{2}\b/);

  return match?.[0];
}

export function toIsoTimestamp(value: string | undefined): string | undefined {
  if (!hasText(value) || value.length !== 14) {
    return undefined;
  }

  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(8, 10)}:${value.slice(10, 12)}:${value.slice(12, 14)}Z`;
}

export function parseSparkleStatus(
  value: string | undefined,
): SparkleDraftStatus {
  switch (value) {
    case "draft":
    case "captured":
    case "needs_clarify":
    case "paused":
    case "rekindled":
    case "discarded":
      return value;
    default:
      return "captured";
  }
}
