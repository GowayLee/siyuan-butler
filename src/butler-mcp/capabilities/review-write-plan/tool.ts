import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { reviewWritePlanUseCase } from "../../../application/use-cases/review-write-plan.js";
import type { ButlerMcpRuntimeContext } from "../../runtime/context.js";
import { planTokenSchema } from "../shared/schemas.js";
import { buildKeyValueToolText, toToolResult } from "../shared/tool-result.js";

export const reviewWritePlanInputSchema = {
  plan_token: planTokenSchema,
};

export async function handleReviewWritePlan(
  context: ButlerMcpRuntimeContext,
  input: {
    plan_token: z.infer<typeof planTokenSchema>;
  },
) {
  const writePlan = await context.handoffStore.loadPlan(input.plan_token);
  const reviewResult = reviewWritePlanUseCase(writePlan);
  const needsConfirmation = reviewResult.decision === "ask_confirm";
  const nextAction =
    reviewResult.decision === "allow"
      ? "execute"
      : reviewResult.decision === "ask_confirm"
        ? "ask-user-confirmation"
        : "stop";
  const blockedBy =
    nextAction === "stop"
      ? writePlan.blocked_by && writePlan.blocked_by.length > 0
        ? writePlan.blocked_by
        : [reviewResult.reason]
      : undefined;
  const reviewToken =
    reviewResult.decision === "allow" || reviewResult.decision === "ask_confirm"
      ? await context.handoffStore.saveReview(reviewResult)
      : undefined;

  await context.handoffStore.deletePlan(input.plan_token);

  return {
    decision: reviewResult.decision,
    review_token: reviewToken,
    needs_confirmation: needsConfirmation,
    confirm_scope: reviewResult.confirm_scope,
    blocked_by: blockedBy,
    next_action: nextAction,
  };
}

function presentReviewWritePlanResult(
  structuredContent: Record<string, unknown>,
) {
  return toToolResult(
    buildKeyValueToolText(
      [],
      [
        ["decision", structuredContent.decision],
        ["review_token", structuredContent.review_token],
        ["needs_confirmation", structuredContent.needs_confirmation],
        ["confirm_scope", structuredContent.confirm_scope],
        ["next_action", structuredContent.next_action],
        ["blocked_by", structuredContent.blocked_by],
      ],
    ),
    structuredContent,
  );
}

export function registerReviewWritePlanTool(
  server: McpServer,
  context: ButlerMcpRuntimeContext,
): void {
  server.registerTool(
    "review-write-plan",
    {
      title: "审查写入计划 · review-write-plan",
      description:
        "读取上一步原样返回的 plan_token，并对对应 WritePlan 应用 Policy Guard。",
      inputSchema: reviewWritePlanInputSchema,
    },
    async (input) =>
      presentReviewWritePlanResult(await handleReviewWritePlan(context, input)),
  );
}
