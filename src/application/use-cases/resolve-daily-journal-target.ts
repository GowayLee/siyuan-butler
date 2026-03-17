import type { ButlerReadModelPort } from "../../adapter/contracts.js";
import type { DailyJournalReadModel } from "../../adapter/read-models.js";
import type { TargetSectionRef } from "../../domain/value-objects/common.js";
import type { WritePlan } from "../../domain/objects/write-plan.js";
import { resolveDailyJournalTarget } from "../shared/target-resolution.js";

export interface ResolveDailyJournalTargetInput {
  journal_date: string;
  section_kind: TargetSectionRef["section_kind"];
  section_label?: string;
}

export interface ResolveDailyJournalTargetResult {
  journal: DailyJournalReadModel;
  target_page: WritePlan["target_page"];
  target_section: WritePlan["target_section"];
  blocked_by: string[];
}

export async function resolveDailyJournalTargetUseCase(
  reader: ButlerReadModelPort,
  input: ResolveDailyJournalTargetInput,
): Promise<ResolveDailyJournalTargetResult> {
  const journal = await reader.readDailyJournal(input.journal_date);
  const resolved = resolveDailyJournalTarget({
    journal,
    section_kind: input.section_kind,
    preferred_section_label: input.section_label,
  });

  return {
    journal,
    target_page: resolved.target_page,
    target_section: resolved.target_section,
    blocked_by: resolved.blocked_by,
  };
}
