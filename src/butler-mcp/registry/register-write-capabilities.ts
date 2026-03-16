import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { handleExecuteReviewedWritePlan } from "../capabilities/execute-reviewed-write-plan/handler.js";
import { presentExecuteReviewedWritePlanResult } from "../capabilities/execute-reviewed-write-plan/presenter.js";
import { executeReviewedWritePlanInputSchema } from "../capabilities/execute-reviewed-write-plan/schema.js";
import { handlePrepareCaptureWritePlan } from "../capabilities/prepare-capture-write-plan/handler.js";
import { presentPrepareCaptureWritePlanResult } from "../capabilities/prepare-capture-write-plan/presenter.js";
import { prepareCaptureWritePlanInputSchema } from "../capabilities/prepare-capture-write-plan/schema.js";
import { handleReviewWritePlan } from "../capabilities/review-write-plan/handler.js";
import { presentReviewWritePlanResult } from "../capabilities/review-write-plan/presenter.js";
import { reviewWritePlanInputSchema } from "../capabilities/review-write-plan/schema.js";
import type { ButlerMcpRuntimeContext } from "../runtime/context.js";

export function registerWriteCapabilities(
  server: McpServer,
  context: ButlerMcpRuntimeContext,
  capabilityIds: Set<string>,
): void {
  if (capabilityIds.has("prepare-capture-write-plan")) {
    server.registerTool(
      "prepare-capture-write-plan",
      {
        title: "准备 Capture 写入计划 · prepare-capture-write-plan",
        description:
          "将最小 SparkleDraft 收敛为可进入 review 的 capture WritePlan。",
        inputSchema: prepareCaptureWritePlanInputSchema,
      },
      async (input) =>
        presentPrepareCaptureWritePlanResult(
          await handlePrepareCaptureWritePlan(context, input),
        ),
    );
  }

  if (capabilityIds.has("review-write-plan")) {
    server.registerTool(
      "review-write-plan",
      {
        title: "审查写入计划 · review-write-plan",
        description: "对 WritePlan 应用 Butler 的 Policy Guard review 边界。",
        inputSchema: reviewWritePlanInputSchema,
      },
      async (input) =>
        presentReviewWritePlanResult(handleReviewWritePlan(input)),
    );
  }

  if (capabilityIds.has("execute-reviewed-write-plan")) {
    server.registerTool(
      "execute-reviewed-write-plan",
      {
        title: "执行已审查写入计划 · execute-reviewed-write-plan",
        description: "只执行已经被 Policy Guard 放行的 final_write_plan。",
        inputSchema: executeReviewedWritePlanInputSchema,
      },
      async (input) =>
        presentExecuteReviewedWritePlanResult(
          await handleExecuteReviewedWritePlan(context, input),
        ),
    );
  }
}
