import type {
  JournalDate,
  TargetSectionRef,
} from "../domain/value-objects/common.js";

export interface JournalSectionReadModel {
  section_kind: TargetSectionRef["section_kind"];
  section_id?: string;
  section_label?: string;
  exists: boolean;
  append_supported: boolean;
}

export interface DailyJournalReadModel {
  journal_date: JournalDate;
  page_id?: string;
  notebook_id?: string;
  notebook_hint?: string;
  page_exists: boolean;
  sparkles_section?: JournalSectionReadModel;
  journal_body_section?: JournalSectionReadModel;
}

export interface JournalContextReadModel {
  journal_date: JournalDate;
  page_id?: string;
  section_kind?: TargetSectionRef["section_kind"];
  summary_lines: string[];
  related_block_ids?: string[];
}

export interface AffectedObjectRef {
  object_type: "daily-note" | "section" | "sparkle" | "journal-entry";
  object_id?: string;
  note?: string;
}

export interface ControlledWriteReceipt {
  plan_id: string;
  summary: string;
  affected_objects: AffectedObjectRef[];
  section_repaired?: boolean;
}
