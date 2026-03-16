import { randomUUID } from "node:crypto";

import { prepareCaptureWritePlanCapability } from "../../../application/services/capture-service.js";
import type { ButlerMcpRuntimeContext } from "../../runtime/context.js";
import type { sparkleDraftSchema } from "../shared/schemas.js";
import type { z } from "zod";

export async function handlePrepareCaptureWritePlan(
  context: ButlerMcpRuntimeContext,
  input: {
    plan_id?: string;
    journal_date: string;
    section_label?: string;
    scope_note?: string;
    draft: z.infer<typeof sparkleDraftSchema>;
  },
) {
  const write_plan = await prepareCaptureWritePlanCapability(context.adapter, {
    plan_id: input.plan_id ?? randomUUID(),
    draft: input.draft,
    journal_date: input.journal_date,
    section_label: input.section_label,
    scope_note: input.scope_note,
  });

  return { write_plan };
}
