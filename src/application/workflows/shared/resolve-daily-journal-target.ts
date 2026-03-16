import type { ButlerReadModelPort } from "../../../adapter/ports/contracts.js";
import type { DailyJournalReadModel } from "../../../adapter/models/read-model.js";
import { resolveDailyJournalTarget } from "../../../adapter/resolvers/target-resolver.js";
import type { TargetSectionRef } from "../../../domain/value-objects/common.js";
import type { WritePlan } from "../../../domain/objects/write-plan.js";

export interface ResolveDailyJournalTargetCapabilityInput {
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

export async function resolveDailyJournalTargetWorkflow(
  reader: ButlerReadModelPort,
  input: ResolveDailyJournalTargetCapabilityInput,
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
