import { randomUUID } from "node:crypto";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { prepareCaptureWritePlanUseCase } from "../../../application/use-cases/prepare-capture-write-plan.js";
import type { ButlerMcpRuntimeContext } from "../../runtime/context.js";
import { sparkleDraftSchema } from "../shared/schemas.js";
import { buildKeyValueToolText, toToolResult } from "../shared/tool-result.js";

export const prepareCaptureWritePlanInputSchema = {
  journal_date: z.string(),
  section_label: z.string().optional(),
  scope_note: z.string().optional(),
  draft: sparkleDraftSchema,
};

export async function handlePrepareCaptureWritePlan(
  context: ButlerMcpRuntimeContext,
  input: {
    journal_date: string;
    section_label?: string;
    scope_note?: string;
    draft: z.infer<typeof sparkleDraftSchema>;
  },
) {
  const writePlan = await prepareCaptureWritePlanUseCase(
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

function presentPrepareCaptureWritePlanResult(
  structuredContent: Record<string, unknown>,
) {
  const nextAction = structuredContent.next_action;

  return toToolResult(
    buildKeyValueToolText(
      [
        nextAction === "review"
          ? "已生成 plan token，可进入 review。"
          : "已生成 plan token，但当前计划仍有阻塞项。",
      ],
      [
        ["plan_token", structuredContent.plan_token],
        ["journal_date", structuredContent.journal_date],
        ["next_action", structuredContent.next_action],
        ["blocked_by", structuredContent.blocked_by],
      ],
    ),
    structuredContent,
  );
}

export function registerPrepareCaptureWritePlanTool(
  server: McpServer,
  context: ButlerMcpRuntimeContext,
): void {
  server.registerTool(
    "prepare-capture-write-plan",
    {
      title: "准备 Capture 写入计划 · prepare-capture-write-plan",
      description:
        "将最小 SparkleDraft 收敛为可进入 review 的 capture plan token；后续必须原样传递返回的 plan_token。",
      inputSchema: prepareCaptureWritePlanInputSchema,
    },
    async (input) =>
      presentPrepareCaptureWritePlanResult(
        await handlePrepareCaptureWritePlan(context, input),
      ),
  );
}
