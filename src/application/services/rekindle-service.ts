import type { ButlerReadModelPort } from "../../adapter/ports/contracts.js";
import type { RekindleProposal } from "../../domain/objects/rekindle-proposal.js";
import type { WritePlan } from "../../domain/objects/write-plan.js";
import { prepareRekindleWritePlan } from "../workflows/rekindle/prepare-rekindle-write-plan.js";

export interface PrepareRekindleWritePlanInput {
  plan_id: string;
  proposal: RekindleProposal;
  journal_date: string;
  scope_note?: string;
}

export async function prepareRekindleWritePlanCapability(
  reader: ButlerReadModelPort,
  input: PrepareRekindleWritePlanInput,
): Promise<WritePlan> {
  const journal = await reader.readDailyJournal(input.journal_date);

  return prepareRekindleWritePlan({
    plan_id: input.plan_id,
    proposal: input.proposal,
    journal,
    scope_note: input.scope_note,
  }).write_plan;
}
