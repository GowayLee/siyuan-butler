import { randomUUID } from "node:crypto";

import { prepareCaptureWritePlanCapability } from "../../../application/services/capture-service.js";
import type { ButlerMcpRuntimeContext } from "../../runtime/context.js";
import type { sparkleDraftSchema } from "../shared/schemas.js";
import type { z } from "zod";

export async function handlePrepareCaptureWritePlan(
  context: ButlerMcpRuntimeContext,
  input: {
    journal_date: string;
    section_label?: string;
    scope_note?: string;
    draft: z.infer<typeof sparkleDraftSchema>;
  },
) {
  const writePlan = await prepareCaptureWritePlanCapability(
    context.adapter,
    {
      plan_id: randomUUID(),
      draft: input.draft,
      journal_date: input.journal_date,
      section_label: input.section_label,
      scope_note: input.scope_note,
    },
    {
      today_sparkles_target_cache: context.todaySparklesTargetCache,
    },
  );
  const planToken = await context.handoffStore.savePlan(writePlan);
  const blockedBy =
    writePlan.blocked_by !== undefined && writePlan.blocked_by.length > 0
      ? writePlan.blocked_by
      : undefined;

  return {
    plan_token: planToken,
    journal_date: writePlan.target_page.journal_date,
    next_action: blockedBy === undefined ? "review" : "stop",
    blocked_by: blockedBy,
  };
}
