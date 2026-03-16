import type { ButlerReadModelPort } from "../../adapter/ports/contracts.js";
import type { SparkleDraft } from "../../domain/objects/sparkle-draft.js";
import type { WritePlan } from "../../domain/objects/write-plan.js";
import { prepareCaptureWritePlan } from "../workflows/capture/prepare-capture-write-plan.js";

export interface PrepareCaptureWritePlanInput {
  plan_id: string;
  draft: SparkleDraft;
  journal_date: string;
  section_label?: string;
  scope_note?: string;
}

export async function prepareCaptureWritePlanCapability(
  reader: ButlerReadModelPort,
  input: PrepareCaptureWritePlanInput,
): Promise<WritePlan> {
  const journal = await reader.readDailyJournal(input.journal_date);

  return prepareCaptureWritePlan({
    plan_id: input.plan_id,
    draft: input.draft,
    journal,
    section_label: input.section_label,
    scope_note: input.scope_note,
  }).write_plan;
}
