import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { executeReviewedWritePlanUseCase } from "../../../application/use-cases/execute-reviewed-write-plan.js";
import type { AffectedObjectRef } from "../../../adapter/read-models.js";
import type { ButlerMcpRuntimeContext } from "../../runtime/context.js";
import { reviewTokenSchema } from "../shared/schemas.js";
import { buildKeyValueToolText, toToolResult } from "../shared/tool-result.js";

export const executeReviewedWritePlanInputSchema = {
  review_token: reviewTokenSchema,
  confirmation_granted: z.boolean().optional(),
};

function findAffectedObject(
  affectedObjects: AffectedObjectRef[],
  objectType: AffectedObjectRef["object_type"],
): AffectedObjectRef | undefined {
  return affectedObjects.find(
    (objectRef) => objectRef.object_type === objectType,
  );
}

export async function handleExecuteReviewedWritePlan(
  context: ButlerMcpRuntimeContext,
  input: {
    review_token: z.infer<typeof reviewTokenSchema>;
    confirmation_granted?: boolean;
  },
) {
  const reviewResult = await context.handoffStore.loadReview(
    input.review_token,
  );
  const receipt = await executeReviewedWritePlanUseCase(context.adapter, {
    review_result: reviewResult,
    confirmation_granted: input.confirmation_granted,
  });
  const writePlan = reviewResult.final_write_plan;
  const pageRef = findAffectedObject(receipt.affected_objects, "daily-note");
  const sectionRef = findAffectedObject(receipt.affected_objects, "section");
  const sparkleRef = findAffectedObject(receipt.affected_objects, "sparkle");
  const repairedSection = receipt.section_repaired === true;

  if (
    writePlan?.operation_type === "append-sparkle" &&
    pageRef?.object_id !== undefined &&
    sectionRef?.object_id !== undefined
  ) {
    await context.todaySparklesTargetCache.write({
      journal_date: writePlan.target_page.journal_date,
      page_id: pageRef.object_id,
      section_id: sectionRef.object_id,
      section_label: writePlan.target_section.section_label,
    });
  }

  await context.handoffStore.deleteReview(input.review_token);

  return {
    journal_date: writePlan?.target_page.journal_date,
    page_id: pageRef?.object_id,
    section_id: sectionRef?.object_id,
    sparkle_block_id: sparkleRef?.object_id,
    repaired_section: repairedSection,
    next_action: "done",
  };
}

function presentExecuteReviewedWritePlanResult(
  structuredContent: Record<string, unknown>,
) {
  return toToolResult(
    buildKeyValueToolText(
      [],
      [
        ["journal_date", structuredContent.journal_date],
        ["page_id", structuredContent.page_id],
        ["section_id", structuredContent.section_id],
        ["sparkle_block_id", structuredContent.sparkle_block_id],
        ["repaired_section", structuredContent.repaired_section],
        ["next_action", structuredContent.next_action],
      ],
    ),
    structuredContent,
  );
}

export function registerExecuteReviewedWritePlanTool(
  server: McpServer,
  context: ButlerMcpRuntimeContext,
): void {
  server.registerTool(
    "execute-reviewed-write-plan",
    {
      title: "执行已审查写入计划 · execute-reviewed-write-plan",
      description:
        "读取上一步原样返回的 review_token，并只执行已经被 Policy Guard 放行的计划。",
      inputSchema: executeReviewedWritePlanInputSchema,
    },
    async (input) =>
      presentExecuteReviewedWritePlanResult(
        await handleExecuteReviewedWritePlan(context, input),
      ),
  );
}
