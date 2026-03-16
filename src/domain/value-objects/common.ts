export type SparkleSourceType =
  | "conversation"
  | "reading"
  | "web"
  | "music"
  | "image"
  | "photo-editing"
  | "experiment"
  | "work"
  | "life"
  | "other";

export type SparkleKind = "affective" | "cognitive" | "mixed";

export type SparkleDraftStatus =
  | "draft"
  | "captured"
  | "needs_clarify"
  | "paused"
  | "rekindled"
  | "discarded";

export type CaptureMode = "auto-extract" | "minimal-followup" | "user-directed";

export type CaptureConfidence = "low" | "medium" | "high";

export type WriteIntent =
  | "proposal_only"
  | "suggest_save"
  | "user_requested_save";

export type RekindleTrigger =
  | "user-explicit"
  | "conversation-matured"
  | "butler-suggested";

export type RekindleGoal =
  | "test-maturity"
  | "shape-entry"
  | "write-journal-entry"
  | "keep-as-sparkle";

export type RekindleDepth = "light" | "standard" | "deep";

export type MaturityHint = "unclear" | "emerging" | "ready";

export type RekindleMode = "brief" | "full" | "postpone";

export type ProposalMaturity = "borderline" | "ready" | "strong";

export type EntryStyleHint = "judgment" | "observation" | "affective" | "mixed";

export type ProposalConfidence = "low" | "medium" | "high";

export type WriteOperationType = "append-sparkle" | "append-journal-entry";

export type WritePlanOrigin = "capture" | "rekindle";

export type WriteRiskLevel = "low" | "medium" | "high";

export type ReviewDecision = "allow" | "ask_confirm" | "downgrade" | "reject";

export type DowngradeTarget =
  | "proposal-only"
  | "sparkle-draft-only"
  | "suggestion-only";

export type RejectCode =
  | "user-opt-out"
  | "target-missing"
  | "target-ambiguous"
  | "semantic-mismatch"
  | "low-value-noise"
  | "risk-too-high";

export type JournalDate = string;
export type IsoTimestamp = string;

export interface SparkleSnapshot {
  source: string;
  glow: string;
  trace?: string[];
  pull?: string[];
}

export interface WriteTargetHint {
  journal_date?: JournalDate;
  page_kind: "daily-note";
  section_kind: "sparkles" | "journal-body";
  section_label?: string;
}

export interface TargetPageRef {
  page_kind: "daily-note";
  journal_date: JournalDate;
  page_id?: string;
  notebook_hint?: string;
}

export interface TargetSectionRef {
  section_kind: "sparkles" | "journal-body";
  section_id?: string;
  section_label?: string;
  insertion_mode: "append";
}

export interface ContentPreview {
  title?: string;
  body: string;
  preview_format: "markdown";
}

export interface SideEffect {
  kind: "none" | "multi-block-write";
  preview: string;
}

export interface SourceRef {
  ref_type: "sparkle" | "proposal" | "conversation";
  ref_id?: string;
  note?: string;
}

export interface ReviewCheck {
  check:
    | "target-clear"
    | "preview-clear"
    | "semantic-fit"
    | "side-effects-acceptable";
  result: "pass" | "warn" | "fail";
  note?: string;
}
