import type { SparkleSnapshot } from "../value-objects/common.js";
import { hasText, normalizeTextList } from "../support/helpers.js";

export interface SparkleDraft {
  source: string;
  glow: string;
  trace?: string[];
  pull?: string[];
}

export function listSparkleDraftCoreGaps(
  draft: Pick<SparkleDraft, "source" | "glow">,
): string[] {
  const gaps: string[] = [];

  if (!hasText(draft.source)) {
    gaps.push("SparkleDraft 缺少 source，无法保住触发物。");
  }

  if (!hasText(draft.glow)) {
    gaps.push("SparkleDraft 缺少 glow，无法保住方向感。");
  }

  return gaps;
}

export function hasSparkleDraftCore(
  draft: Pick<SparkleDraft, "source" | "glow">,
): boolean {
  return hasText(draft.source) && hasText(draft.glow);
}

export function normalizeSparkleDraft(draft: SparkleDraft): SparkleDraft {
  return {
    ...draft,
    source: draft.source.trim(),
    glow: draft.glow.trim(),
    trace: normalizeTextList(draft.trace),
    pull: normalizeTextList(draft.pull),
  };
}

export function toSparkleSnapshot(draft: SparkleDraft): SparkleSnapshot {
  const normalized = normalizeSparkleDraft(draft);

  return {
    source: normalized.source,
    glow: normalized.glow,
    trace: normalized.trace,
    pull: normalized.pull,
  };
}

export function canSparkleDraftEnterWriteReview(draft: SparkleDraft): boolean {
  return listSparkleDraftCoreGaps(draft).length === 0;
}
