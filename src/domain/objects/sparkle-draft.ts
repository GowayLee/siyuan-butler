import type {
  CaptureConfidence,
  CaptureMode,
  IsoTimestamp,
  JournalDate,
  SparkleDraftStatus,
  SparkleKind,
  SparkleSnapshot,
  SparkleSourceType,
  WriteIntent,
} from "../value-objects/common.js";
import { hasText, normalizeText, normalizeTextList } from "../support/helpers.js";

export interface SparkleDraft {
  id: string;
  created_at: IsoTimestamp;
  source_type: SparkleSourceType;
  sparkle_kind: SparkleKind;
  source: string;
  glow: string;
  status: SparkleDraftStatus;
  trace?: string[];
  pull?: string[];
  source_excerpt?: string;
  context?: string;
  why_it_matters?: string;
  next_hint?: string;
  target_journal_date?: JournalDate;
  capture_mode?: CaptureMode;
  confidence?: CaptureConfidence;
  write_intent?: WriteIntent;
  tags_hint?: string[];
}

export function listSparkleDraftCoreGaps(
  draft: Pick<SparkleDraft, "source" | "glow" | "status">,
): string[] {
  const gaps: string[] = [];

  if (!hasText(draft.source)) {
    gaps.push("SparkleDraft 缺少 source，无法保住触发物。");
  }

  if (!hasText(draft.glow)) {
    gaps.push("SparkleDraft 缺少 glow，无法保住方向感。");
  }

  if (draft.status === "discarded") {
    gaps.push("SparkleDraft 已被标记为 discarded，不应继续进入写入审查。");
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
    source_excerpt: normalizeText(draft.source_excerpt),
    context: normalizeText(draft.context),
    why_it_matters: normalizeText(draft.why_it_matters),
    next_hint: normalizeText(draft.next_hint),
    tags_hint: normalizeTextList(draft.tags_hint),
  };
}

export function toSparkleSnapshot(draft: SparkleDraft): SparkleSnapshot {
  const normalized = normalizeSparkleDraft(draft);

  return {
    id: normalized.id,
    source: normalized.source,
    glow: normalized.glow,
    trace: normalized.trace,
    pull: normalized.pull,
    sparkle_kind: normalized.sparkle_kind,
    context: normalized.context,
  };
}

export function canSparkleDraftEnterWriteReview(draft: SparkleDraft): boolean {
  return listSparkleDraftCoreGaps(draft).length === 0;
}
