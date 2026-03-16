import type {
  CaptureConfidence,
  CaptureMode,
  IsoTimestamp,
  JournalDate,
  SparkleDraftStatus,
  SparkleKind,
  SparkleSourceType,
  WriteIntent,
} from "./common.js";

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
