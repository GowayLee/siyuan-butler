import { randomUUID } from "node:crypto";

import { prepareRekindleWritePlanCapability } from "../../../application/services/rekindle-service.js";
import type { ButlerMcpRuntimeContext } from "../../runtime/context.js";
import type { rekindleProposalSchema } from "../shared/schemas.js";
import type { z } from "zod";

function resolveRekindleJournalDate(input: {
  proposal: z.infer<typeof rekindleProposalSchema>;
  journal_date?: string;
}) {
  return input.journal_date ?? input.proposal.write_target.journal_date;
}

export async function handlePrepareRekindleWritePlan(
  context: ButlerMcpRuntimeContext,
  input: {
    plan_id?: string;
    journal_date?: string;
    scope_note?: string;
    proposal: z.infer<typeof rekindleProposalSchema>;
  },
) {
  const resolvedJournalDate = resolveRekindleJournalDate(input);

  if (resolvedJournalDate === undefined) {
    throw new Error(
      "prepare-rekindle-write-plan 需要 journal_date，或 proposal.write_target.journal_date 已明确。",
    );
  }

  const write_plan = await prepareRekindleWritePlanCapability(context.adapter, {
    plan_id: input.plan_id ?? randomUUID(),
    proposal: input.proposal,
    journal_date: resolvedJournalDate,
    scope_note: input.scope_note,
  });

  return { write_plan };
}
